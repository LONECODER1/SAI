"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Places a multi-item or single-item pharmacy order
 * Ported & elevated from Medstore-mern: buyproduct
 */
export async function createMedicineOrder({
  storeId,
  prescriptionId = null,
  deliveryAddress,
  customerPhone,
  deliveryType = "HOME_DELIVERY",
  items = [],
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User record not found");
    if (!storeId) throw new Error("Store ID is required");
    if (!deliveryAddress || !customerPhone) {
      throw new Error("Delivery address and contact phone are required");
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Cart cannot be empty");
    }

    // Execute atomic order creation and stock decrements
    const order = await db.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Medicine "${item.productId}" no longer available`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
          );
        }

        // Determine effective unit price (respecting Flash Clearance if active)
        const unitPrice =
          product.isFlashSale && product.flashSalePrice
            ? product.flashSalePrice
            : product.price;

        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal += lineTotal;

        // Decrement product inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });

        // Record DemandSignal for local sales velocity
        await tx.demandSignal.create({
          data: {
            medicineName: product.name,
            genericName: product.genericName,
            latitude: 28.6139,
            longitude: 77.2090,
            signalType: "ORDER",
            weight: 1.5,
          },
        });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice: lineTotal,
        });
      }

      const deliveryFee = deliveryType === "HOME_DELIVERY" ? 30.0 : 0.0;
      const totalAmount = Math.round((subtotal + deliveryFee) * 100) / 100;

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `CC-ORD-${randomSuffix}`;

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          patientId: user.id,
          storeId,
          prescriptionId,
          status: "PENDING",
          deliveryType,
          deliveryAddress,
          customerPhone,
          subtotal,
          deliveryFee,
          totalAmount,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: { include: { product: true } },
          store: { select: { storeName: true, phone: true } },
        },
      });

      // If tied to a prescription, mark it fulfilled
      if (prescriptionId) {
        await tx.prescription.update({
          where: { id: prescriptionId },
          data: { isFulfilled: true },
        });
      }

      return createdOrder;
    });

    revalidatePath("/dashboard");
    revalidatePath("/store");

    return { success: true, order };
  } catch (error) {
    console.error("Order placement failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves order history for the current patient
 * Ported & elevated from Medstore-mern: getorderhistory
 */
export async function getPatientOrders() {
  const { userId } = await auth();
  if (!userId) return { orders: [] };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return { orders: [] };

    const orders = await db.order.findMany({
      where: { patientId: user.id },
      include: {
        store: { select: { storeName: true, phone: true, city: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { orders };
  } catch (error) {
    console.error("Failed to fetch patient orders:", error);
    return { orders: [], error: error.message };
  }
}
