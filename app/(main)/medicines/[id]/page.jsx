import React from "react";
import { notFound } from "next/navigation";
import { getMedicineById } from "@/actions/medicines";
import { db } from "@/lib/prisma";
import SingleMedicineView from "./_components/single-medicine-view";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { product } = await getMedicineById(id);
  if (!product) return { title: "Medicine Not Found - MedStore" };

  return {
    title: `${product.name} - MedStore Telepharmacy`,
    description: `Order ${product.name} with local pharmacy store finder in ascending distance order and Google Maps navigation`,
  };
}

export default async function SingleMedicinePage({ params }) {
  const { id } = await params;
  const userLat = 25.2425;
  const userLng = 86.9842;

  const { product } = await getMedicineById(id, userLat, userLng);

  if (!product) {
    notFound();
  }

  // Fetch all verified active stores in the ecosystem
  let allStores = [];
  try {
    allStores = await db.store.findMany({
      where: {
        verificationStatus: "VERIFIED",
        isActive: true,
      },
      select: {
        id: true,
        storeName: true,
        storeAddress: true,
        city: true,
        phone: true,
        latitude: true,
        longitude: true,
        rating: true,
      },
    });
  } catch (err) {
    console.error("Failed to load stores for single medicine page:", err);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SingleMedicineView
        product={product}
        allStores={allStores}
        userLat={userLat}
        userLng={userLng}
      />
    </div>
  );
}
