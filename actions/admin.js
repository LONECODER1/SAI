"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { doctors: pendingDoctors };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const verifiedDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { doctors: verifiedDoctors };
  } catch (error) {
    throw new Error("Failed to fetch verified doctors");
  }
}

export async function updateDoctorStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const status = formData.get("status");

  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status:", error);
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

export async function updateDoctorActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const suspend = formData.get("suspend") === "true";

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingPayouts = await db.payout.findMany({
      where: {
        status: "PROCESSING",
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            credits: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts: pendingPayouts };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    throw new Error("Failed to fetch pending payouts: " + error.message);
  }
}

export async function getProcessedPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const processedPayouts = await db.payout.findMany({
      where: {
        status: "PROCESSED",
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            credits: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        processedAt: "desc",
      },
    });

    return { payouts: processedPayouts };
  } catch (error) {
    console.error("Failed to fetch processed payouts:", error);
    throw new Error("Failed to fetch processed payouts: " + error.message);
  }
}

export async function approvePayout(formData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const adminUser = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (adminUser?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  const payoutId = formData.get("payoutId");
  if (!payoutId) {
    throw new Error("Payout ID is required");
  }

  try {
    const payout = await db.payout.findUnique({
      where: {
        id: payoutId,
      },
      include: {
        doctor: true,
      },
    });

    if (!payout) {
      throw new Error("Payout request not found");
    }

    if (payout.status === "PROCESSED") {
      throw new Error("Payout has already been processed");
    }

    if (!payout.doctor) {
      throw new Error("Doctor not found for this payout");
    }

    if (payout.doctor.credits < payout.credits) {
      throw new Error(
        `Doctor currently has ${payout.doctor.credits} credits, but this payout requires ${payout.credits} credits`
      );
    }

    const updatedPayout = await db.$transaction(async (tx) => {
      // 1. Deduct credits from doctor
      await tx.user.update({
        where: { id: payout.doctorId },
        data: {
          credits: {
            decrement: payout.credits,
          },
        },
      });

      // 2. Record credit transaction for audit trail
      await tx.creditTransaction.create({
        data: {
          userId: payout.doctorId,
          amount: -payout.credits,
          type: "ADMIN_ADJUSTMENT",
        },
      });

      // 3. Update payout status to PROCESSED
      const res = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: adminUser.name || adminUser.email || adminUser.id,
        },
      });

      return res;
    });

    revalidatePath("/admin");
    revalidatePath("/doctor");
    return { success: true, payout: updatedPayout };
  } catch (error) {
    console.error("Failed to approve payout:", error);
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}

// =============================================================
// PHARMACY STORE APPROVALS & GOVERNANCE (MEDSTORE ADMIN)
// =============================================================

export async function getPendingStores() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingStores = await db.store.findMany({
      where: {
        verificationStatus: "PENDING",
      },
      include: {
        owner: { select: { name: true, email: true, imageUrl: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { stores: pendingStores };
  } catch (error) {
    console.error("Failed to fetch pending stores:", error);
    throw new Error("Failed to fetch pending stores");
  }
}

export async function getVerifiedStores() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const verifiedStores = await db.store.findMany({
      where: {
        verificationStatus: "VERIFIED",
      },
      include: {
        owner: { select: { name: true, email: true, imageUrl: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { stores: verifiedStores };
  } catch (error) {
    console.error("Failed to fetch verified stores:", error);
    throw new Error("Failed to fetch verified stores");
  }
}

export async function updateStoreStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const storeId = formData.get("storeId");
  const status = formData.get("status");

  if (!storeId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    await db.store.update({
      where: {
        id: storeId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update store status:", error);
    throw new Error(`Failed to update store status: ${error.message}`);
  }
}

export async function toggleStoreActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const storeId = formData.get("storeId");
  const isActive = formData.get("isActive") === "true";

  if (!storeId) throw new Error("Store ID is required");

  try {
    await db.store.update({
      where: {
        id: storeId,
      },
      data: {
        isActive,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle store active status:", error);
    throw new Error("Failed to toggle store active status");
  }
}
