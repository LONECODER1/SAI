import { test, describe } from "node:test";
import assert from "node:assert";
import {
  searchPharmacopeia,
  getPopularMedicinePresets,
  generateBatchNumber,
  getDefaultExpiryDate,
  parseMedicineCsv,
  PHARMACOPEIA_DATABASE,
} from "../../lib/pharmacopeia.js";
import {
  calculateDemandVelocity,
  calculateReorderThresholds,
  calculateAntiOverstockCeiling,
  evaluateRestockRecommendation,
} from "../../lib/algorithms/smart-stock.js";

describe("Store Side Medicine Listing & SmartStock Recommendation Protocol", () => {
  // Test 1: Pharmacopeia search and preset matching
  test("1. Pharmacopeia Autocomplete: correctly searches brand, generic salt, and returns pre-populated specs", () => {
    const doloResults = searchPharmacopeia("dolo", "ALL", 5);
    assert.ok(doloResults.length > 0, "Should find Dolo 650");
    const dolo = doloResults[0];
    assert.strictEqual(dolo.name, "Dolo 650");
    assert.strictEqual(dolo.genericName, "Paracetamol 650mg");
    assert.strictEqual(dolo.category, "Pain Relief");
    assert.strictEqual(dolo.dosageForm, "Tablet");
    assert.ok(dolo.mrp >= dolo.suggestedPrice, "MRP must be >= suggested selling price");
    assert.ok(dolo.safetyStock > 0, "Safety stock should be defined");
    assert.ok(dolo.maxStockCap > dolo.safetyStock, "Max stock cap should exceed safety stock");

    // Generic salt search
    const amoxResults = searchPharmacopeia("Amoxicillin", "ALL", 5);
    assert.ok(amoxResults.length >= 2, "Should find both Augmentin and Amoxyclav for Amoxicillin salt query");
  });

  // Test 2: Popular Essentials Presets
  test("2. Popular Presets Shelf: returns high-demand pharmacy medicines for 1-click addition", () => {
    const presets = getPopularMedicinePresets();
    assert.ok(presets.length >= 5, "Should return at least 5 popular preset medicines");
    const names = presets.map((p) => p.name);
    assert.ok(names.includes("Dolo 650"));
    assert.ok(names.includes("Augmentin 625 Duo"));
    assert.ok(names.includes("Pan-D"));
  });

  // Test 3: Batch Number & Expiry Calculation
  test("3. Batch & Expiry Generation: produces valid pharmaceutical batch codes and future dates", () => {
    const batchCode = generateBatchNumber("Augmentin");
    assert.ok(batchCode.startsWith("BATCH-"), "Batch code must start with BATCH-");
    assert.ok(batchCode.includes("AUG"), "Batch code should contain brand abbreviation");

    const expiry18M = getDefaultExpiryDate(18);
    const expiryDate = new Date(expiry18M);
    const now = new Date();
    assert.ok(expiryDate > now, "Generated expiry date must be in the future");
    const diffMonths = (expiryDate.getFullYear() - now.getFullYear()) * 12 + (expiryDate.getMonth() - now.getMonth());
    assert.ok(diffMonths >= 17 && diffMonths <= 19, "Generated date must be ~18 months ahead");
  });

  // Test 4: CSV Bulk Import Parser
  test("4. CSV Bulk Import Engine: parses valid multi-medicine CSV and enforces validations", () => {
    const validCsv = `name,genericName,category,dosageForm,strength,price,mrp,stockQuantity,expiryDate
Dolo 650,Paracetamol 650mg,Pain Relief,Tablet,650mg,30,35,80,2027-12-31
Augmentin 625 Duo,Amoxicillin + Clavulanic Acid,Antibiotics,Tablet,625mg,195,228,45,2027-08-15
Pan-D,Pantoprazole + Domperidone,Gastrointestinal,Capsule,40mg/30mg,180,215,60,2027-10-30`;

    const parsed = parseMedicineCsv(validCsv);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.products.length, 3);
    assert.strictEqual(parsed.products[0].name, "Dolo 650");
    assert.strictEqual(parsed.products[0].price, 30);
    assert.strictEqual(parsed.products[0].mrp, 35);
    assert.strictEqual(parsed.products[0].stockQuantity, 80);

    // Invalid CSV without required price column
    const invalidCsv = `name,genericName,category\nDolo 650,Paracetamol,Pain Relief`;
    const invalidResult = parseMedicineCsv(invalidCsv);
    assert.strictEqual(invalidResult.success, false);
    assert.ok(invalidResult.error.includes("price"));
  });

  // Test 5: SmartStock Demand Engine & Anti-Overstock Ceiling
  test("5. SmartStock Recommendation & Anti-Overstocking Engine: calculates EOQ and enforces ceiling", () => {
    // Scenario A: Depleted stock (Stock = 2, SS = 3, ROP = 8) -> Must recommend restock capped at S_max
    const resultCritical = evaluateRestockRecommendation({
      currentStock: 2,
      prescriptions: 28,
      searches: 42,
      storeSales: 20,
      leadTimeDays: 2,
    });

    assert.strictEqual(resultCritical.status, "CRITICAL_LOW");
    assert.ok(resultCritical.recommendedRestock > 0, "Critical stock must trigger recommended replenishment");
    assert.ok(
      resultCritical.currentStock + resultCritical.recommendedRestock <= resultCritical.maxStockCap,
      "Restock amount plus current stock must never exceed anti-overstock ceiling S_max"
    );

    // Scenario B: Overstock position (Stock = 140, S_max = 65) -> Must suppress restocking completely
    const resultOverstock = evaluateRestockRecommendation({
      currentStock: 140,
      prescriptions: 14,
      searches: 20,
      storeSales: 10,
      leadTimeDays: 2,
    });

    assert.strictEqual(resultOverstock.status, "OVERSTOCK_WARNING");
    assert.strictEqual(resultOverstock.recommendedRestock, 0, "Must recommend 0 units to prevent overstock write-off");
    assert.ok(resultOverstock.reason.includes("Anti-Overstock Ceiling"));
  });

  // Test 6: Generic Substitute Demand Intelligence
  test("6. Generic Substitute Intelligence: detects branded prescripts and calculates margin advantage", () => {
    const brandedPrescription = {
      name: "Augmentin 625 Duo",
      genericName: "Amoxicillin + Clavulanic Acid",
      mrp: 228.0,
      prescribedCount: 14,
    };

    const storeGeneric = {
      name: "Amoxyclav 625",
      genericName: "Amoxicillin + Clavulanic Acid",
      price: 110.0,
      mrp: 210.0,
      stockQuantity: 45,
    };

    // Calculate patient savings
    const patientSavings = brandedPrescription.mrp - storeGeneric.price;
    const savingsPercent = Math.round((patientSavings / brandedPrescription.mrp) * 100);

    assert.ok(savingsPercent >= 45, "Generic substitute must provide at least 45% savings for Augmentin vs Amoxyclav");
    assert.strictEqual(patientSavings, 118);
  });
});
