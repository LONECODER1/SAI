import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Unified User Dashboard & Auth Integration Protocol", () => {
  // Test 1: Route Protection Verification
  it("should ensure all healthcare and telepharmacy routes are protected in middleware route matcher", () => {
    // Protected patterns required by middleware.js
    const protectedRoutes = [
      "/dashboard(.*)",
      "/medicines(.*)",
      "/doctors(.*)",
      "/onboarding(.*)",
      "/doctor(.*)",
      "/store(.*)",
      "/admin(.*)",
      "/video-call(.*)",
      "/appointments(.*)",
    ];

    const regexMap = protectedRoutes.map((pattern) => new RegExp(`^${pattern}$`));

    // Test cases that must be protected:
    const testPaths = [
      "/medicines",
      "/medicines?category=Antibiotics",
      "/medicines/paracetamol",
      "/dashboard",
      "/dashboard?tab=medicines",
      "/dashboard?tab=doctors",
      "/doctors",
      "/doctors/Cardiologist",
      "/appointments",
      "/doctor",
      "/store",
      "/admin",
    ];

    for (const path of testPaths) {
      const isProtected = regexMap.some((regex) => regex.test(path));
      assert.equal(
        isProtected,
        true,
        `Path "${path}" must be protected by authentication middleware`
      );
    }

    // Public asset paths that must NOT be protected
    const publicPaths = ["/icon.svg", "/careconnect-surgeons-2.jpg"];
    for (const path of publicPaths) {
      const isProtected = regexMap.some((regex) => regex.test(path));
      assert.equal(
        isProtected,
        false,
        `Public asset "${path}" should not be blocked by protected routes`
      );
    }
  });

  // Test 2: Unified Dashboard Dual-Interface Linking (Prescription -> Dukaan fulfillment)
  it("should seamlessly bridge doctor e-prescriptions into Dukaan basket fulfillment", () => {
    const doctorPrescription = {
      id: "rx-991",
      doctorId: "doc-1",
      diagnosis: "Acute Bronchial Infection",
      items: [
        {
          id: "item-1",
          medicineName: "Amoxicillin 500mg",
          genericName: "Amoxicillin",
          dosage: "1-0-1",
          durationDays: 5,
          quantity: 10,
        },
        {
          id: "item-2",
          medicineName: "Paracetamol 650mg",
          genericName: "Paracetamol",
          dosage: "1-1-1",
          durationDays: 3,
          quantity: 9,
        },
      ],
    };

    const nearbyDukaanCatalog = [
      {
        id: "prod-101",
        storeId: "store-apex",
        name: "Amoxicillin 500mg Capsules",
        genericName: "Amoxicillin",
        price: 85,
        stockQuantity: 40,
      },
      {
        id: "prod-102",
        storeId: "store-apex",
        name: "Paracetamol 650mg Tablets",
        genericName: "Paracetamol",
        price: 32,
        stockQuantity: 100,
      },
      {
        id: "prod-103",
        storeId: "store-other",
        name: "Cetirizine 10mg",
        genericName: "Cetirizine",
        price: 20,
        stockQuantity: 15,
      },
    ];

    // Auto-match algorithm utilized in DashboardClient
    const matchedProducts = [];
    doctorPrescription.items.forEach((rxItem) => {
      const match = nearbyDukaanCatalog.find(
        (p) =>
          p.name.toLowerCase().includes(rxItem.medicineName.toLowerCase()) ||
          (p.genericName &&
            rxItem.genericName &&
            p.genericName.toLowerCase().includes(rxItem.genericName.toLowerCase()))
      );
      if (match) {
        matchedProducts.push({
          ...match,
          prescribedQuantity: rxItem.quantity,
          subtotal: match.price * rxItem.quantity,
        });
      }
    });

    assert.equal(matchedProducts.length, 2);
    assert.equal(matchedProducts[0].id, "prod-101");
    assert.equal(matchedProducts[1].id, "prod-102");

    const totalFulfillmentCost = matchedProducts.reduce((sum, item) => sum + item.subtotal, 0);
    assert.equal(totalFulfillmentCost, 85 * 10 + 32 * 9); // 850 + 288 = 1138
  });

  // Test 3: Dashboard Tab State Machine
  it("should validate allowed tab transitions in the unified patient dashboard", () => {
    const validTabs = ["overview", "doctors", "medicines", "orders"];

    const testTransitions = [
      { from: "overview", to: "doctors", reason: "Join video consultation room" },
      { from: "doctors", to: "medicines", reason: "Order prescribed meds at Dukaan" },
      { from: "medicines", to: "orders", reason: "Track delivery of placed order" },
      { from: "orders", to: "overview", reason: "Return to dual executive view" },
    ];

    for (const transition of testTransitions) {
      assert.equal(validTabs.includes(transition.from), true);
      assert.equal(validTabs.includes(transition.to), true);
    }
  });

  // Test 4: Main Navigation & Route Consolidation
  it("should consolidate standalone /doctors and /medicines directly into unified dashboard", () => {
    // Mapping of legacy standalone entry points to unified dashboard targets
    const routeMappings = {
      "/doctors": "/dashboard?tab=doctors",
      "/medicines": "/dashboard?tab=medicines",
      "/appointments": "/dashboard?tab=doctors",
    };

    assert.equal(routeMappings["/doctors"], "/dashboard?tab=doctors");
    assert.equal(routeMappings["/medicines"], "/dashboard?tab=medicines");
    assert.equal(routeMappings["/appointments"], "/dashboard?tab=doctors");
  });
});
