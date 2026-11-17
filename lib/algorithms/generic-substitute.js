/**
 * Generic Substitute Savings Engine ("Substitute Intelligence")
 * Identifies bio-equivalent generic formulations across local pharmacies and calculates patient savings.
 */

/**
 * Normalizes active formulation string for fuzzy equivalence.
 * @param {string} str Formulation name (e.g. "Paracetamol", "Amoxicillin + Clavulanic Acid")
 * @returns {string} Lowercase trimmed canonical string
 */
export function normalizeFormulation(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[+,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Evaluates candidate products to find the best bio-equivalent generic alternative.
 * @param {Object} prescribedMedicine The prescribed branded medicine
 * @param {string} prescribedMedicine.name Brand name (e.g. "Augmentin 625 Duo")
 * @param {string} prescribedMedicine.genericName Active formulation (e.g. "Amoxicillin + Clavulanic Acid")
 * @param {number} prescribedMedicine.price Price of the branded medicine
 * @param {string} [prescribedMedicine.dosageForm] Tablet, Syrup, etc.
 * @param {string} [prescribedMedicine.strength] 625mg, 500mg, etc.
 * @param {Array} candidateProducts List of available products in the local area
 * @param {number} [savingsThresholdPercentage=15] Minimum savings percentage to trigger recommendation
 * @returns {Object|null} Generic substitute details with savings metrics or null if no qualifying generic found
 */
export function findBestGenericSubstitute(
  prescribedMedicine,
  candidateProducts = [],
  savingsThresholdPercentage = 15
) {
  if (!prescribedMedicine || !prescribedMedicine.genericName) return null;

  const targetGeneric = normalizeFormulation(prescribedMedicine.genericName);
  const targetPrice = Number(prescribedMedicine.price);

  if (isNaN(targetPrice) || targetPrice <= 0) return null;

  // Filter matching bio-equivalent candidates
  const matchingCandidates = candidateProducts.filter((product) => {
    // Cannot suggest the exact same branded product as its own alternative
    if (product.id && product.id === prescribedMedicine.id) return false;
    if (
      product.name &&
      product.name.toLowerCase() === prescribedMedicine.name.toLowerCase()
    ) {
      return false;
    }

    // Must have matching generic formulation
    if (!product.genericName) return false;
    const prodGeneric = normalizeFormulation(product.genericName);
    if (prodGeneric !== targetGeneric) return false;

    // Must have positive stock
    if ((product.stockQuantity ?? 1) <= 0) return false;

    // Dosage form check if present
    if (
      prescribedMedicine.dosageForm &&
      product.dosageForm &&
      prescribedMedicine.dosageForm.toLowerCase() !==
        product.dosageForm.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  if (matchingCandidates.length === 0) return null;

  // Find lowest price alternative
  const cheapestGeneric = matchingCandidates.reduce((min, cur) =>
    cur.price < min.price ? cur : min
  );

  const genericPrice = Number(cheapestGeneric.price);
  if (genericPrice >= targetPrice) return null;

  const savingsAmount = Math.round((targetPrice - genericPrice) * 100) / 100;
  const savingsPercentage = Math.round((savingsAmount / targetPrice) * 100);

  if (savingsPercentage < savingsThresholdPercentage) return null;

  return {
    prescribedMedicine: {
      name: prescribedMedicine.name,
      price: targetPrice,
    },
    substituteMedicine: cheapestGeneric,
    savingsAmount,
    savingsPercentage,
    recommendationLabel: `Save ₹${savingsAmount} (${savingsPercentage}% OFF) with generic equivalent: ${cheapestGeneric.name}`,
  };
}
