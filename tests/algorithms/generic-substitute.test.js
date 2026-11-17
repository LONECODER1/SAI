import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findBestGenericSubstitute,
  normalizeFormulation,
} from "../../lib/algorithms/generic-substitute.js";

describe("Generic Substitute Savings Engine", () => {
  it("should normalize complex chemical formulations consistently", () => {
    assert.equal(
      normalizeFormulation("Amoxicillin + Clavulanic Acid"),
      "amoxicillin clavulanic acid"
    );
    assert.equal(
      normalizeFormulation("Paracetamol, 500mg"),
      "paracetamol 500mg"
    );
  });

  it("should detect cheaper generic alternative when savings >= 15%", () => {
    const brandedMedicine = {
      id: "brand-1",
      name: "Augmentin 625 Duo Tablet",
      genericName: "Amoxicillin + Clavulanic Acid",
      price: 210,
      dosageForm: "Tablet",
      strength: "625mg",
    };

    const candidateProducts = [
      {
        id: "gen-1",
        name: "Amoxyclav 625 Tablet",
        genericName: "Amoxicillin + Clavulanic Acid",
        price: 115,
        dosageForm: "Tablet",
        strength: "625mg",
        stockQuantity: 40,
      },
      {
        id: "gen-2",
        name: "Clavam 625 Tablet",
        genericName: "Amoxicillin + Clavulanic Acid",
        price: 160,
        dosageForm: "Tablet",
        strength: "625mg",
        stockQuantity: 20,
      },
    ];

    const result = findBestGenericSubstitute(brandedMedicine, candidateProducts);

    assert.ok(result !== null);
    assert.equal(result.substituteMedicine.name, "Amoxyclav 625 Tablet");
    assert.equal(result.savingsAmount, 95); // 210 - 115
    assert.equal(result.savingsPercentage, 45); // 95/210 * 100%
  });

  it("should return null if substitute savings is below 15% threshold", () => {
    const brandedMedicine = {
      id: "brand-2",
      name: "Brand X 500mg",
      genericName: "Metformin",
      price: 100,
    };

    const candidateProducts = [
      {
        id: "gen-3",
        name: "Generic X 500mg",
        genericName: "Metformin",
        price: 90, // Only 10% savings
        stockQuantity: 50,
      },
    ];

    const result = findBestGenericSubstitute(brandedMedicine, candidateProducts, 15);
    assert.equal(result, null);
  });
});
