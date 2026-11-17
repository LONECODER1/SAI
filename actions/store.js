"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateExpiryStatus, calculateFlashSalePrice } from "@/lib/algorithms/expiry-engine";
import { evaluateRestockRecommendation } from "@/lib/algorithms/smart-stock";

/**
 * Helper to authenticate seller or admin
 */
async function getAuthenticatedSeller() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { store: true },
  });

  if (!user) {
    throw new Error("User record not found");
  }

  // If user is admin or seller with store, allow access
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    throw new Error("Access denied: Not registered as a pharmacy seller");
  }

  return user;
}

/**
 * Retrieves the current user's store
 */
export async function getCurrentStore() {
  try {
    const { userId } = await auth();
    if (!userId) return { store: null };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { store: true },
    });

    return { store: user?.store || null, user };
  } catch (error) {
    console.error("Failed to fetch current store:", error);
    return { store: null, error: error.message };
  }
}

/**
 * Registers a new pharmacy store ("Dukaan")
 * Ported & elevated from Medstore-mern: registerstore
 */
export async function registerStoreAction(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User record not found");

    const storeName = formData.get("storeName");
    const ownerName = formData.get("ownerName") || user.name || "Store Owner";
    const ownerEmail = formData.get("ownerEmail") || user.email;
    const phone = formData.get("phone");
    const licenseNumber = formData.get("licenseNumber");
    const licenseDocumentUrl = formData.get("licenseDocumentUrl") || null;
    const storeAddress = formData.get("storeAddress");
    const city = formData.get("city") || "City";
    const postalCode = formData.get("postalCode") || null;
    const latitude = parseFloat(formData.get("latitude"));
    const longitude = parseFloat(formData.get("longitude"));

    if (!storeName || !phone || !licenseNumber || !storeAddress) {
      throw new Error("Store Name, Phone, License Number, and Address are required");
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Valid geographic coordinates (Latitude and Longitude) are required");
    }

    // Check if store already exists for this user
    const existingStore = await db.store.findUnique({
      where: { ownerId: user.id },
    });

    if (existingStore) {
      throw new Error("You already have a registered store");
    }

    const store = await db.store.create({
      data: {
        ownerId: user.id,
        storeName,
        ownerName,
        ownerEmail,
        phone,
        licenseNumber,
        licenseDocumentUrl,
        storeAddress,
        city,
        postalCode,
        latitude,
        longitude,
        verificationStatus: "PENDING",
      },
    });

    // Ensure user role is updated to SELLER
    if (user.role !== "SELLER") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "SELLER" },
      });
    }

    revalidatePath("/store");
    return { success: true, store };
  } catch (error) {
    console.error("Failed to register store:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves the store's full medicine inventory with dynamically calculated expiry statuses
 * Ported & elevated from Medstore-mern: getallStoreProduct
 */
export async function getStoreInventory() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) return { products: [] };

    const products = await db.product.findMany({
      where: { storeId: user.store.id },
      orderBy: { createdAt: "desc" },
    });

    // Evaluate dynamic expiry status for every item
    const evaluatedProducts = products.map((product) => {
      const expiryEval = evaluateExpiryStatus(product.expiryDate);
      const isLowStock = product.stockQuantity <= product.safetyStock;

      return {
        ...product,
        evaluatedExpiryStatus: expiryEval.status,
        expiryDaysRemaining: expiryEval.daysRemaining,
        expiryLabel: expiryEval.label,
        expiryColor: expiryEval.color,
        isEligibleForFlashSale: expiryEval.isEligibleForFlashSale,
        isLowStock,
      };
    });

    return { products: evaluatedProducts, store: user.store };
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return { products: [], error: error.message };
  }
}

/**
 * Adds a new medicine product to the store inventory
 * Ported & elevated from Medstore-mern: addproduct
 */
export async function addProductAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");
    if (user.store.verificationStatus !== "VERIFIED") {
      throw new Error("Store must be verified by admin before listing medicines");
    }

    const name = formData.get("name");
    const genericName = formData.get("genericName") || null;
    const category = formData.get("category") || "General Healthcare";
    const dosageForm = formData.get("dosageForm") || "Tablet";
    const strength = formData.get("strength") || null;
    const batchNumber = formData.get("batchNumber") || `BATCH-${Date.now().toString().slice(-6)}`;
    const price = parseFloat(formData.get("price"));
    const mrp = formData.get("mrp") ? parseFloat(formData.get("mrp")) : price;
    const stockQuantity = parseInt(formData.get("stockQuantity") || "0", 10);
    const safetyStock = parseInt(formData.get("safetyStock") || "15", 10);
    const maxStockCap = parseInt(formData.get("maxStockCap") || "120", 10);
    const expiryDateStr = formData.get("expiryDate");
    const imageUrl = formData.get("imageUrl") || null;
    const productDetails = formData.get("productDetails") || null;
    const description = formData.get("description") || null;

    if (!name || isNaN(price) || price < 0) {
      throw new Error("Valid medicine name and price are required");
    }

    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
    const expiryEval = evaluateExpiryStatus(expiryDate);

    const product = await db.product.create({
      data: {
        storeId: user.store.id,
        name,
        genericName,
        category,
        dosageForm,
        strength,
        batchNumber,
        price,
        mrp,
        stockQuantity: Math.max(0, stockQuantity),
        safetyStock,
        maxStockCap,
        expiryDate,
        expiryStatus: expiryEval.status,
        imageUrl,
        productDetails,
        description,
      },
    });

    revalidatePath("/store");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to add product:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates stock quantity or price for an existing product
 */
export async function updateProductStockAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    const productId = formData.get("productId");
    const stockQuantity = parseInt(formData.get("stockQuantity"), 10);
    const price = formData.get("price") ? parseFloat(formData.get("price")) : undefined;

    if (!productId || isNaN(stockQuantity)) {
      throw new Error("Product ID and valid stock quantity are required");
    }

    const updateData = { stockQuantity: Math.max(0, stockQuantity) };
    if (price !== undefined && !isNaN(price)) {
      updateData.price = Math.max(0, price);
    }

    const product = await db.product.update({
      where: { id: productId, storeId: user.store.id },
      data: updateData,
    });

    revalidatePath("/store");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to update stock:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Suggestion 2: Enrolls near-expiry medicine into Flash Clearance
 */
export async function toggleFlashSaleAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    const productId = formData.get("productId");
    const discountPercentage = parseFloat(formData.get("discountPercentage") || "50");

    if (!productId) throw new Error("Product ID is required");

    const product = await db.product.findUnique({
      where: { id: productId, storeId: user.store.id },
    });

    if (!product) throw new Error("Product not found");

    if (product.isFlashSale) {
      // Toggle OFF
      const updated = await db.product.update({
        where: { id: productId },
        data: {
          isFlashSale: false,
          flashSaleDiscount: null,
          flashSalePrice: null,
        },
      });
      revalidatePath("/store");
      return { success: true, product: updated, message: "Removed from Flash Clearance" };
    }

    // Toggle ON with calculated discount
    const { flashSalePrice } = calculateFlashSalePrice(product.price, discountPercentage);

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        isFlashSale: true,
        flashSaleDiscount: discountPercentage,
        flashSalePrice,
      },
    });

    revalidatePath("/store");
    return {
      success: true,
      product: updated,
      message: `Enrolled in Flash Clearance at ₹${flashSalePrice} (${discountPercentage}% OFF)`,
    };
  } catch (error) {
    console.error("Failed to toggle flash sale:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves orders placed at the store with status management
 * Ported & elevated from Medstore-mern: getallOrderedProduct
 */
export async function getStoreOrders() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) return { orders: [] };

    const orders = await db.order.findMany({
      where: { storeId: user.store.id },
      include: {
        patient: { select: { name: true, email: true, imageUrl: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { orders };
  } catch (error) {
    console.error("Failed to fetch store orders:", error);
    return { orders: [], error: error.message };
  }
}

/**
 * Updates order progression status (Accepted -> Preparing -> Out for Delivery -> Delivered)
 * Ported & elevated from Medstore-mern: getallOrderedProduct order.updateOne
 */
export async function updateOrderStatusAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    const orderId = formData.get("orderId");
    const status = formData.get("status");

    const validStatuses = [
      "PENDING",
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!orderId || !validStatuses.includes(status)) {
      throw new Error("Invalid Order ID or Status");
    }

    const order = await db.order.update({
      where: { id: orderId, storeId: user.store.id },
      data: { status },
    });

    revalidatePath("/store");
    return { success: true, order };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analytics Engine: Computes monthly delivered orders count (Jan-Dec) + revenue totals
 * Ported & elevated from Medstore-mern: getAnalytics
 */
export async function getStoreAnalytics() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) return { analytics: null };

    const storeId = user.store.id;
    const currentYear = new Date().getFullYear();

    const deliveredOrders = await db.order.findMany({
      where: {
        storeId,
        status: "DELIVERED",
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        },
      },
    });

    // Monthly bucket aggregation (Jan - Dec)
    const monthlyCounts = {
      jan: 0, feb: 0, march: 0, april: 0, may: 0, june: 0,
      july: 0, aug: 0, sept: 0, oct: 0, nov: 0, dec: 0,
    };

    const monthKeys = [
      "jan", "feb", "march", "april", "may", "june",
      "july", "aug", "sept", "oct", "nov", "dec",
    ];

    let totalRevenue = 0;

    deliveredOrders.forEach((order) => {
      const monthIdx = new Date(order.createdAt).getMonth();
      const monthKey = monthKeys[monthIdx];
      if (monthKey) {
        monthlyCounts[monthKey]++;
      }
      totalRevenue += order.totalAmount || 0;
    });

    const totalProducts = await db.product.count({ where: { storeId } });
    const allOrdersCount = await db.order.count({ where: { storeId } });

    return {
      analytics: {
        storeName: user.store.storeName,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDeliveredOrders: deliveredOrders.length,
        totalOrders: allOrdersCount,
        totalProducts,
        monthlyCounts,
      },
    };
  } catch (error) {
    console.error("Failed to fetch store analytics:", error);
    return { analytics: null, error: error.message };
  }
}

// Baseline demand velocity calibration per therapeutic category (used when telemetry signals are early)
const CATEGORY_DEMAND_BASELINES = {
  "Pain Relief": { prescriptions: 24, searches: 40, sales: 18 },
  "Antibiotics": { prescriptions: 18, searches: 30, sales: 14 },
  "Gastrointestinal": { prescriptions: 20, searches: 35, sales: 15 },
  "Diabetes Care": { prescriptions: 26, searches: 32, sales: 20 },
  "Cardiovascular": { prescriptions: 22, searches: 28, sales: 16 },
  "Respiratory & Cough": { prescriptions: 18, searches: 32, sales: 14 },
  "Vitamins & Supplements": { prescriptions: 14, searches: 25, sales: 12 },
  "First Aid & Devices": { prescriptions: 8, searches: 15, sales: 8 },
  "General Healthcare": { prescriptions: 12, searches: 20, sales: 10 },
};

/**
 * SmartStock Suggestion Engine: Computes demand recommendations for all store products
 * Balances high-demand restocking against capital depletion and perishable waste.
 */
export async function getStoreSmartStockSuggestions() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) {
      return {
        suggestions: [],
        summary: { totalEvaluated: 0, criticalCount: 0, reorderCount: 0, overstockCount: 0, optimalCount: 0, totalRestockUnits: 0, estimatedCapitalRequired: 0 },
        genericOpportunities: [],
        inventoryHealth: { score: 100, grade: "Optimal", totalInventoryValue: 0, stockoutRiskCount: 0, overstockRiskCount: 0, expiryRiskCount: 0 },
      };
    }

    const storeId = user.store.id;
    const products = await db.product.findMany({
      where: { storeId },
      orderBy: { stockQuantity: "asc" },
    });

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const suggestions = [];
    let criticalCount = 0;
    let reorderCount = 0;
    let overstockCount = 0;
    let optimalCount = 0;
    let totalRestockUnits = 0;
    let estimatedCapitalRequired = 0;
    let totalInventoryValue = 0;
    let expiryRiskCount = 0;

    for (const product of products) {
      totalInventoryValue += (product.price || 0) * (product.stockQuantity || 0);

      // 1. Look up local demand signals matching brand name or generic formulation
      const brandKeyword = product.name.split(" ")[0].toLowerCase();
      const genericKeyword = product.genericName ? product.genericName.split(" ")[0].toLowerCase() : null;

      const signals = await db.demandSignal.findMany({
        where: {
          OR: [
            { medicineName: { contains: brandKeyword, mode: "insensitive" } },
            genericKeyword ? { genericName: { contains: genericKeyword, mode: "insensitive" } } : undefined,
            genericKeyword ? { medicineName: { contains: genericKeyword, mode: "insensitive" } } : undefined,
          ].filter(Boolean),
          createdAt: { gte: fourteenDaysAgo },
        },
      });

      // 2. Query direct order fulfilled sales for this product
      const orderSalesAgg = await db.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          productId: product.id,
          order: {
            storeId,
            status: { in: ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] },
            createdAt: { gte: fourteenDaysAgo },
          },
        },
      });
      const directSalesCount = orderSalesAgg._sum.quantity || 0;

      let prescriptionsCount = signals.filter((s) => s.signalType === "PRESCRIPTION").length;
      let searchesCount = signals.filter((s) => s.signalType === "SEARCH").length;
      let salesCount = signals.filter((s) => s.signalType === "ORDER").length + directSalesCount;

      // 3. Apply baseline calibration if local signals are sparse
      if (prescriptionsCount === 0 && searchesCount === 0 && salesCount === 0) {
        const baseline = CATEGORY_DEMAND_BASELINES[product.category] || CATEGORY_DEMAND_BASELINES["General Healthcare"];
        prescriptionsCount = baseline.prescriptions;
        searchesCount = baseline.searches;
        salesCount = baseline.sales;
      }

      // 4. Run SmartStock evaluation algorithm
      const evalResult = evaluateRestockRecommendation({
        currentStock: product.stockQuantity,
        prescriptions: prescriptionsCount,
        searches: searchesCount,
        storeSales: salesCount,
        leadTimeDays: product.leadTimeDays || 2,
      });

      // Check expiry status
      const expiryEval = evaluateExpiryStatus(product.expiryDate);
      if (expiryEval.status === "CRITICAL_EXPIRY" || expiryEval.status === "APPROACHING_EXPIRY") {
        expiryRiskCount++;
      }

      // Calculate wholesale restock capital (estimated 75% of retail price)
      const unitCapitalCost = Math.round((product.price * 0.75) * 100) / 100;
      const capitalCost = Math.round(evalResult.recommendedRestock * unitCapitalCost);

      if (evalResult.status === "CRITICAL_LOW") criticalCount++;
      else if (evalResult.status === "REORDER_RECOMMENDED") reorderCount++;
      else if (evalResult.status === "OVERSTOCK_WARNING") overstockCount++;
      else optimalCount++;

      totalRestockUnits += evalResult.recommendedRestock;
      estimatedCapitalRequired += capitalCost;

      suggestions.push({
        product: {
          ...product,
          evaluatedExpiryStatus: expiryEval.status,
          expiryDaysRemaining: expiryEval.daysRemaining,
        },
        recommendation: {
          ...evalResult,
          unitCapitalCost,
          capitalCost,
          telemetry: {
            prescriptions: prescriptionsCount,
            searches: searchesCount,
            storeSales: salesCount,
          },
        },
      });
    }

    // Sort: Critical Restock first, then Reorder, then Overstock, then Optimal
    const statusOrder = {
      CRITICAL_LOW: 1,
      REORDER_RECOMMENDED: 2,
      OVERSTOCK_WARNING: 3,
      OPTIMAL: 4,
    };
    suggestions.sort((a, b) => statusOrder[a.recommendation.status] - statusOrder[b.recommendation.status]);

    // 5. Generic Substitute Intelligence Opportunities (Core Feature 1)
    // Find doctor prescriptions in the area for branded medications where store holds generic stock
    const genericPrescriptionSignals = await db.demandSignal.findMany({
      where: {
        signalType: "PRESCRIPTION",
        createdAt: { gte: fourteenDaysAgo },
      },
      take: 20,
    });

    const genericOpportunities = [];
    const processedGenerics = new Set();

    for (const signal of genericPrescriptionSignals) {
      if (!signal.genericName || processedGenerics.has(signal.genericName.toLowerCase())) continue;
      processedGenerics.add(signal.genericName.toLowerCase());

      const genericMatch = products.find(
        (p) =>
          p.genericName &&
          p.genericName.toLowerCase().includes(signal.genericName.toLowerCase().slice(0, 10))
      );

      if (genericMatch) {
        genericOpportunities.push({
          prescribedBrand: signal.medicineName,
          genericSalt: signal.genericName,
          storeProduct: genericMatch,
          estimatedDemand: 12,
          patientSavingsPercent: Math.round(((genericMatch.mrp - genericMatch.price) / genericMatch.mrp) * 100) || 45,
        });
      }
    }

    // 6. Overall Store Inventory Health Score (0 - 100)
    let healthScore = 100;
    if (products.length > 0) {
      const stockoutPenalty = (criticalCount / products.length) * 35;
      const reorderPenalty = (reorderCount / products.length) * 15;
      const overstockPenalty = (overstockCount / products.length) * 15;
      const expiryPenalty = (expiryRiskCount / products.length) * 20;
      healthScore = Math.max(20, Math.round(100 - stockoutPenalty - reorderPenalty - overstockPenalty - expiryPenalty));
    }

    let grade = "Excellent";
    if (healthScore < 60) grade = "Critical Attention Needed";
    else if (healthScore < 80) grade = "Good — Restock Advised";
    else if (healthScore < 95) grade = "Healthy Inventory";

    return {
      suggestions,
      summary: {
        totalEvaluated: products.length,
        criticalCount,
        reorderCount,
        overstockCount,
        optimalCount,
        totalRestockUnits,
        estimatedCapitalRequired,
      },
      genericOpportunities: genericOpportunities.slice(0, 4),
      inventoryHealth: {
        score: healthScore,
        grade,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        stockoutRiskCount: criticalCount,
        overstockRiskCount: overstockCount,
        expiryRiskCount,
      },
    };
  } catch (error) {
    console.error("Failed to calculate stock suggestions:", error);
    return {
      suggestions: [],
      summary: { totalEvaluated: 0, criticalCount: 0, reorderCount: 0, overstockCount: 0, optimalCount: 0, totalRestockUnits: 0, estimatedCapitalRequired: 0 },
      genericOpportunities: [],
      inventoryHealth: { score: 100, grade: "Optimal", totalInventoryValue: 0, stockoutRiskCount: 0, overstockRiskCount: 0, expiryRiskCount: 0 },
      error: error.message,
    };
  }
}

/**
 * Updates full medicine details (price, mrp, strength, batch, expiry, etc.)
 */
export async function updateProductDetailsAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const productId = formData.get("productId");
    if (!productId) throw new Error("Product ID is required");

    const name = formData.get("name");
    const genericName = formData.get("genericName") || null;
    const category = formData.get("category") || "General Healthcare";
    const dosageForm = formData.get("dosageForm") || "Tablet";
    const strength = formData.get("strength") || null;
    const batchNumber = formData.get("batchNumber") || null;
    const price = parseFloat(formData.get("price"));
    const mrp = formData.get("mrp") ? parseFloat(formData.get("mrp")) : price;
    const stockQuantity = parseInt(formData.get("stockQuantity") || "0", 10);
    const safetyStock = parseInt(formData.get("safetyStock") || "15", 10);
    const maxStockCap = parseInt(formData.get("maxStockCap") || "120", 10);
    const expiryDateStr = formData.get("expiryDate");
    const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;
    const expiryEval = evaluateExpiryStatus(expiryDate);

    if (!name || isNaN(price) || price < 0) {
      throw new Error("Valid medicine name and price are required");
    }

    const updated = await db.product.update({
      where: { id: productId, storeId: user.store.id },
      data: {
        name,
        genericName,
        category,
        dosageForm,
        strength,
        batchNumber,
        price,
        mrp,
        stockQuantity: Math.max(0, stockQuantity),
        safetyStock,
        maxStockCap,
        expiryDate,
        expiryStatus: expiryEval.status,
      },
    });

    revalidatePath("/store");
    return { success: true, product: updated };
  } catch (error) {
    console.error("Failed to update product details:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a medicine from inventory
 */
export async function deleteProductAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const productId = formData.get("productId");
    if (!productId) throw new Error("Product ID is required");

    await db.product.delete({
      where: { id: productId, storeId: user.store.id },
    });

    revalidatePath("/store");
    return { success: true, message: "Medicine removed from catalog" };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Disposes an expired product batch (blocks from dispensing & writes off inventory)
 */
export async function disposeExpiredProductAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const productId = formData.get("productId");
    if (!productId) throw new Error("Product ID is required");

    const updated = await db.product.update({
      where: { id: productId, storeId: user.store.id },
      data: {
        stockQuantity: 0,
        isActive: false,
        expiryStatus: "EXPIRED",
      },
    });

    revalidatePath("/store");
    return {
      success: true,
      product: updated,
      message: `Expired batch ${updated.batchNumber || updated.name} safely written off and disposed`,
    };
  } catch (error) {
    console.error("Failed to dispose expired product:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click Liquidate All Critical Batches (< 30 days) into Flash Clearance @ 50% discount
 */
export async function liquidateAllCriticalAction() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const products = await db.product.findMany({
      where: { storeId: user.store.id, stockQuantity: { gt: 0 } },
    });

    let enrolledCount = 0;
    for (const prod of products) {
      const evalResult = evaluateExpiryStatus(prod.expiryDate);
      if (evalResult.status === "CRITICAL_EXPIRY" && !prod.isFlashSale) {
        const { flashSalePrice } = calculateFlashSalePrice(prod.price, 50);
        await db.product.update({
          where: { id: prod.id },
          data: {
            isFlashSale: true,
            flashSaleDiscount: 50.0,
            flashSalePrice,
          },
        });
        enrolledCount++;
      }
    }

    revalidatePath("/store");
    return {
      success: true,
      enrolledCount,
      message: `Successfully enrolled ${enrolledCount} critical medicine(s) into 50% Flash Clearance!`,
    };
  } catch (error) {
    console.error("Failed to liquidate critical batches:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates store details and GPS coordinates (geo-pinning)
 */
export async function updateStoreProfileAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const storeName = formData.get("storeName");
    const phone = formData.get("phone");
    const storeAddress = formData.get("storeAddress");
    const city = formData.get("city") || "Bhagalpur";
    const postalCode = formData.get("postalCode") || "812001";
    const latitude = parseFloat(formData.get("latitude"));
    const longitude = parseFloat(formData.get("longitude"));

    if (!storeName || !phone || !storeAddress) {
      throw new Error("Store name, phone, and address are required");
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Valid coordinates are required");
    }

    const updated = await db.store.update({
      where: { id: user.store.id },
      data: {
        storeName,
        phone,
        storeAddress,
        city,
        postalCode,
        latitude,
        longitude,
      },
    });

    revalidatePath("/store");
    return { success: true, store: updated, message: "Store profile updated successfully" };
  } catch (error) {
    console.error("Failed to update store profile:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click store verification (for demo/admin onboarding flow)
 */
export async function verifyStoreAction(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const storeId = formData?.get ? formData.get("storeId") : formData?.storeId;
    if (!storeId) throw new Error("Store ID is required");

    const store = await db.store.update({
      where: { id: storeId },
      data: { verificationStatus: "VERIFIED" },
    });

    revalidatePath("/store");
    revalidatePath("/store/verification");
    return { success: true, store, message: "Store verified successfully" };
  } catch (error) {
    console.error("Failed to verify store:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click Action to Restock a single medicine based on AI SmartStock recommendation
 */
export async function applyRestockAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const productId = formData.get("productId");
    const quantityStr = formData.get("quantity") || formData.get("restockUnits");
    const restockUnits = parseInt(quantityStr, 10);

    if (!productId || isNaN(restockUnits) || restockUnits <= 0) {
      throw new Error("Valid product ID and positive restock quantity are required");
    }

    const product = await db.product.findUnique({
      where: { id: productId, storeId: user.store.id },
    });

    if (!product) throw new Error("Product not found in your inventory");

    const newStock = product.stockQuantity + restockUnits;

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newStock,
        isActive: true,
      },
    });

    revalidatePath("/store");
    return {
      success: true,
      product: updated,
      message: `Restocked ${product.name} by +${restockUnits} units (Current Stock: ${newStock})`,
    };
  } catch (error) {
    console.error("Failed to apply restock:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 1-Click Action to Restock All depleted medicines up to their calculated safe levels
 */
export async function applyBulkRestockAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");

    const itemsJson = formData?.get ? formData.get("itemsJson") : formData?.itemsJson;
    let itemsToRestock = [];

    if (itemsJson) {
      try {
        itemsToRestock = JSON.parse(itemsJson);
      } catch {
        itemsToRestock = [];
      }
    }

    // If no specific item list provided, automatically evaluate and restock critical & reorder items
    if (itemsToRestock.length === 0) {
      const suggestionsData = await getStoreSmartStockSuggestions();
      const eligible = (suggestionsData.suggestions || []).filter(
        (s) =>
          s.recommendation.recommendedRestock > 0 &&
          (s.recommendation.status === "CRITICAL_LOW" || s.recommendation.status === "REORDER_RECOMMENDED")
      );

      itemsToRestock = eligible.map((s) => ({
        productId: s.product.id,
        quantity: s.recommendation.recommendedRestock,
        name: s.product.name,
      }));
    }

    if (itemsToRestock.length === 0) {
      return { success: true, count: 0, message: "No medicines currently require restocking." };
    }

    await db.$transaction(
      itemsToRestock.map((item) =>
        db.product.update({
          where: { id: item.productId, storeId: user.store.id },
          data: {
            stockQuantity: { increment: item.quantity },
            isActive: true,
          },
        })
      )
    );

    revalidatePath("/store");
    return {
      success: true,
      count: itemsToRestock.length,
      message: `Successfully restocked ${itemsToRestock.length} essential medicine(s) into inventory!`,
    };
  } catch (error) {
    console.error("Failed to apply bulk restock:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk imports a list of medicines from CSV / JSON into the store inventory
 */
export async function bulkImportProductsAction(formData) {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) throw new Error("Store not found");
    if (user.store.verificationStatus !== "VERIFIED") {
      throw new Error("Store must be verified before listing medicines");
    }

    const productsJson = formData.get("productsJson");
    if (!productsJson) throw new Error("No products data provided for import");

    let productsList = [];
    try {
      productsList = JSON.parse(productsJson);
    } catch {
      throw new Error("Invalid products data format");
    }

    if (!Array.isArray(productsList) || productsList.length === 0) {
      throw new Error("Products list is empty");
    }

    let insertedCount = 0;
    const errors = [];

    for (const item of productsList) {
      if (!item.name || isNaN(parseFloat(item.price))) {
        errors.push(`Skipped invalid item: ${item.name || "Unknown"}`);
        continue;
      }

      const price = parseFloat(item.price);
      const mrp = item.mrp ? parseFloat(item.mrp) : price;
      const stockQuantity = parseInt(item.stockQuantity || "0", 10);
      const safetyStock = parseInt(item.safetyStock || "15", 10);
      const maxStockCap = parseInt(item.maxStockCap || "120", 10);
      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
      const expiryEval = evaluateExpiryStatus(expiryDate);

      await db.product.create({
        data: {
          storeId: user.store.id,
          name: item.name,
          genericName: item.genericName || null,
          category: item.category || "General Healthcare",
          dosageForm: item.dosageForm || "Tablet",
          strength: item.strength || null,
          batchNumber: item.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
          price,
          mrp,
          stockQuantity: Math.max(0, stockQuantity),
          safetyStock,
          maxStockCap,
          expiryDate,
          expiryStatus: expiryEval.status,
          imageUrl: item.imageUrl || null,
          description: item.description || null,
        },
      });
      insertedCount++;
    }

    revalidatePath("/store");
    return {
      success: true,
      count: insertedCount,
      errors,
      message: `Successfully listed ${insertedCount} medicine(s) in your Dukaan catalog!`,
    };
  } catch (error) {
    console.error("Failed to bulk import products:", error);
    return { success: false, error: error.message };
  }
}
