import { redirect } from "next/navigation";

/**
 * The standalone /medicines route is unified into the Single Patient Dashboard.
 * Redirects directly to /dashboard with the Medicines & Dukaan Storefront active.
 */
export default async function MedicinesRouteRedirect({ searchParams }) {
  const params = await searchParams;
  const prescriptionId = params?.prescriptionId;
  const q = params?.q;
  const category = params?.category;

  const urlParams = new URLSearchParams();
  urlParams.set("tab", "medicines");
  if (prescriptionId) urlParams.set("prescriptionId", prescriptionId);
  if (q) urlParams.set("q", q);
  if (category) urlParams.set("category", category);

  redirect(`/dashboard?${urlParams.toString()}`);
}
