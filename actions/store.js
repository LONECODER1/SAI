"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { evaluateExpiryStatus, calculateFlashSalePrice } from "@/lib/algorithms/expiry-engine";
import { evaluateRestockRecommendation } from "@/lib/algorithms/smart-stock";

/**
 * Helper to authenticate seller
 */
async function getAuthenticatedSeller() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { store: true },
  });

  if (!user || user.role !== "SELLER") {
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

/**
 * SmartStock Suggestion Engine: Computes demand recommendations for all store products
 */
export async function getStoreSmartStockSuggestions() {
  try {
    const user = await getAuthenticatedSeller();
    if (!user.store) return { suggestions: [] };

    const products = await db.product.findMany({
      where: { storeId: user.store.id },
    });

    const suggestions = [];

    for (const product of products) {
      // Look up local demand signals in the past 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const signals = await db.demandSignal.findMany({
        where: {
          medicineName: {
            contains: product.name.split(" ")[0],
            mode: "insensitive",
          },
          createdAt: { gte: fourteenDaysAgo },
        },
      });

      const prescriptionsCount = signals.filter((s) => s.signalType === "PRESCRIPTION").length;
      const searchesCount = signals.filter((s) => s.signalType === "SEARCH").length;
      const salesCount = signals.filter((s) => s.signalType === "ORDER").length;

      const evalResult = evaluateRestockRecommendation({
        currentStock: product.stockQuantity,
        prescriptions: prescriptionsCount,
        searches: searchesCount,
        storeSales: salesCount,
        leadTimeDays: product.leadTimeDays || 2,
      });

      if (evalResult.status !== "OPTIMAL") {
        suggestions.push({
          product,
          recommendation: evalResult,
        });
      }
    }

    return { suggestions };
  } catch (error) {
    console.error("Failed to calculate stock suggestions:", error);
    return { suggestions: [], error: error.message };
  }
}
