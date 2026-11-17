import React from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getFeaturedMedicines, searchMedicinesAndStores } from "@/actions/medicines";
import MedicinesClient from "./_components/medicines-client";

export const metadata = {
  title: "Medicines & Local Dukaans - CareConnect",
  description: "Order prescription medicines from verified nearby pharmacy stores with generic savings and fast local delivery",
};

export default async function MedicinesPage({ searchParams }) {
  const params = await searchParams;
  const prescriptionId = params?.prescriptionId || null;
  const query = params?.q || "";
  const category = params?.category || "ALL";

  const { userId } = await auth();

  // Fetch next upcoming doctor appointment for this user (if logged in)
  let upcomingAppointment = null;
  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (user) {
      upcomingAppointment = await db.appointment.findFirst({
        where: {
          patientId: user.id,
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
        include: {
          doctor: { select: { name: true, specialty: true } },
        },
        orderBy: { startTime: "asc" },
      });
    }
  }

  // Fetch search results & featured medicines
  const [searchData, featuredData] = await Promise.all([
    searchMedicinesAndStores({
      query,
      category,
      prescriptionId,
    }),
    getFeaturedMedicines(),
  ]);

  const products = searchData.products?.length
    ? searchData.products
    : featuredData.products || [];

  const flashClearanceItems = featuredData.flashClearanceItems || [];
  const nearbyStores = searchData.nearbyStores || [];
  const prescribedItems = searchData.prescribedItems || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <MedicinesClient
        initialProducts={products}
        flashClearanceItems={flashClearanceItems}
        nearbyStores={nearbyStores}
        upcomingAppointment={upcomingAppointment}
        prescribedItems={prescribedItems}
        prescriptionId={prescriptionId}
      />
    </div>
  );
}
