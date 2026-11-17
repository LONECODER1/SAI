import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findNearbyStores } from "../../lib/algorithms/haversine.js";
import { findBestGenericSubstitute } from "../../lib/algorithms/generic-substitute.js";
import { evaluateExpiryStatus, calculateFlashSalePrice } from "../../lib/algorithms/expiry-engine.js";

describe("User/Patient Storefront Integration Logic", () => {
  it("should match patient location with nearby pharmacies within 10 km", () => {
    const patientLat = 19.076;
    const patientLng = 72.8777;

    const mockStores = [
      { id: "s1", storeName: "Apex Dukaan", latitude: 19.08, longitude: 72.88 }, // ~0.5 km
      { id: "s2", storeName: "LifeCare Pharmacy", latitude: 19.11, longitude: 72.89 }, // ~4 km
      { id: "s3", storeName: "Faraway Store", latitude: 28.6139, longitude: 77.209 }, // ~1100 km
    ];

    const nearby = findNearbyStores(mockStores, patientLat, patientLng, 10);
    assert.equal(nearby.length, 2);
    assert.equal(nearby[0].id, "s1");
    assert.equal(nearby[1].id, "s2");
  });

  it("should calculate Suggestion 1 generic substitute savings on patient view", () => {
    const brandedDrug = {
      id: "brand-rx",
      name: "Augmentin 625 Duo Tablet",
      genericName: "Amoxicillin + Clavulanic Acid",
      price: 220,
      dosageForm: "Tablet",
    };

    const localCatalog = [
      {
        id: "gen-local",
        name: "Amoxyclav 625 Generic Tablet",
        genericName: "Amoxicillin + Clavulanic Acid",
        price: 110,
        dosageForm: "Tablet",
        stockQuantity: 25,
      },
    ];

    const result = findBestGenericSubstitute(brandedDrug, localCatalog);
    assert.ok(result !== null);
    assert.equal(result.substituteMedicine.name, "Amoxyclav 625 Generic Tablet");
    assert.equal(result.savingsAmount, 110);
    assert.equal(result.savingsPercentage, 50);
  });

  it("should calculate Suggestion 2 flash clearance price for daily chronic medicines", () => {
    const nearExpiryMedicine = {
      name: "Metformin 500mg Daily",
      price: 60,
      expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days left
    };

    const statusEval = evaluateExpiryStatus(nearExpiryMedicine.expiryDate);
    assert.equal(statusEval.isEligibleForFlashSale, true);

    const { flashSalePrice, savings } = calculateFlashSalePrice(nearExpiryMedicine.price, 50);
    assert.equal(flashSalePrice, 30);
    assert.equal(savings, 30);
  });
});
