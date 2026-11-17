"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

export async function setUserRole(formData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Find user in our database
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return { success: false, error: "User not found in database. Please refresh the page to try again." };
    }

    const role = formData.get("role");

    if (!role || !["PATIENT", "DOCTOR", "SELLER"].includes(role)) {
      return { success: false, error: "Invalid role selection" };
    }

    // ===========================
    // PATIENT
    // ===========================
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");

      return {
        success: true,
        redirect: "/doctors",
      };
    }

    // ===========================
    // DOCTOR
    // ===========================
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      if (
        !specialty ||
        isNaN(experience) ||
        !credentialUrl ||
        !description
      ) {
        throw new Error("All fields are required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");

      return {
        success: true,
        redirect: "/doctor/verification",
      };
    }

    // ===========================
    // SELLER (PHARMACY STORE)
    // ===========================
    if (role === "SELLER") {
      const storeName = formData.get("storeName");
      const phone = formData.get("phone");
      const licenseNumber = formData.get("licenseNumber");
      const licenseDocumentUrl = formData.get("licenseDocumentUrl") || null;
      const storeAddress = formData.get("storeAddress");
      const city = formData.get("city") || "City";
      const postalCode = formData.get("postalCode") || null;
      const latitude = parseFloat(formData.get("latitude") || "28.6139");
      const longitude = parseFloat(formData.get("longitude") || "77.2090");

      if (!storeName || !phone || !licenseNumber || !storeAddress) {
        throw new Error("Store Name, Phone, License Number, and Address are required");
      }

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { clerkUserId: userId },
          data: { role: "SELLER" },
        });

        await tx.store.create({
          data: {
            ownerId: user.id,
            storeName,
            ownerName: user.name || "Store Owner",
            ownerEmail: user.email,
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
      });

      revalidatePath("/");

      return {
        success: true,
        redirect: "/store/verification",
      };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);

    throw new Error(
      `Failed to update user profile: ${
        error?.message || "Unknown error"
      }`
    );
  }
}

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}