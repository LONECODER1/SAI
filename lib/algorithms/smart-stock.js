/**
 * SmartStock Demand & Anti-Overstocking Inventory Algorithm
 * Balances high-demand restocking against capital depletion and perishable waste.
 */

/**
 * Calculates local daily demand velocity for a medication within a geographic catchment area.
 * @param {Object} params Demand metrics over the observation window
 * @param {number} params.prescriptions Count of doctor prescriptions in radius
 * @param {number} params.searches Count of patient medicine searches in radius
 * @param {number} params.storeSales Specific store's order volume
 * @param {number} [params.windowDays=14] Time period in days
 * @returns {number} Daily demand velocity (units per day)
 */
export function calculateDemandVelocity({
  prescriptions = 0,
  searches = 0,
  storeSales = 0,
  windowDays = 14,
}) {
  if (windowDays <= 0) throw new Error("Window days must be greater than zero");

  // Calibrated weights
  const w1 = 0.50; // Doctor Prescriptions
  const w2 = 0.20; // Patient Local Searches
  const w3 = 0.30; // Store Orders Fulfilled

  const dailyPrescriptions = prescriptions / windowDays;
  const dailySearches = searches / windowDays;
  const dailySales = storeSales / windowDays;

  const velocity = w1 * dailyPrescriptions + w2 * dailySearches + w3 * dailySales;
  return Math.round(velocity * 100) / 100;
}

/**
 * Calculates Safety Stock (SS) and Reorder Point (ROP)
 * @param {number} demandVelocity Daily demand velocity
 * @param {number} [leadTimeDays=2] Supplier delivery time
 * @param {number} [serviceFactor=1.65] 95% service level factor
 * @param {number} [demandStdDev=1.2] Standard deviation of daily demand
 * @returns {{ safetyStock: number, reorderPoint: number }}
 */
export function calculateReorderThresholds(
  demandVelocity,
  leadTimeDays = 2,
  serviceFactor = 1.65,
  demandStdDev = 1.2
) {
  const leadTime = Math.max(1, leadTimeDays);
  const velocity = Math.max(0.1, demandVelocity);

  const safetyStock = Math.ceil(serviceFactor * demandStdDev * Math.sqrt(leadTime));
  const leadTimeDemand = Math.ceil(velocity * leadTime);
  const reorderPoint = leadTimeDemand + safetyStock;

  return {
    safetyStock,
    reorderPoint,
  };
}

/**
 * Calculates the Anti-Overstock Dynamic Upper Ceiling (S_max)
 * Enforces a strict cap preventing pharmacies from purchasing excess perishable medicine.
 * @param {number} reorderPoint Computed reorder point
 * @param {number} demandVelocity Daily demand velocity
 * @param {number} [maxBufferDays=14] Maximum supply buffer allowed (capped at 14 days)
 * @returns {number} Hard maximum inventory ceiling
 */
export function calculateAntiOverstockCeiling(
  reorderPoint,
  demandVelocity,
  maxBufferDays = 14
) {
  const bufferDays = Math.min(14, Math.max(7, maxBufferDays));
  const bufferQuantity = Math.ceil(demandVelocity * bufferDays);
  return reorderPoint + bufferQuantity;
}

/**
 * Evaluates stock position and outputs intelligent replenishment recommendation.
 * @param {Object} input
 * @param {number} input.currentStock Current physical units in store
 * @param {number} input.prescriptions Doctor prescriptions in area
 * @param {number} input.searches Patient searches in area
 * @param {number} input.storeSales Store sales count
 * @param {number} [input.leadTimeDays=2] Supplier delivery lead time
 * @returns {Object} Comprehensive restock recommendation with safety caps
 */
export function evaluateRestockRecommendation({
  currentStock,
  prescriptions,
  searches,
  storeSales,
  leadTimeDays = 2,
}) {
  const stock = Math.max(0, currentStock || 0);
  const demandVelocity = calculateDemandVelocity({
    prescriptions,
    searches,
    storeSales,
  });

  const { safetyStock, reorderPoint } = calculateReorderThresholds(
    demandVelocity,
    leadTimeDays
  );

  const maxStockCap = calculateAntiOverstockCeiling(
    reorderPoint,
    demandVelocity
  );

  // Economic Order Quantity (EOQ approx for pharmacy batch)
  const monthlyDemand = demandVelocity * 30;
  const eoq = Math.max(10, Math.ceil(Math.sqrt((2 * monthlyDemand * 25) / 2)));

  let recommendedRestock = 0;
  let status = "OPTIMAL";
  let reason = "Stock level is adequate for current local demand velocity.";

  if (stock <= safetyStock) {
    status = "CRITICAL_LOW";
    recommendedRestock = Math.min(eoq, maxStockCap - stock);
    reason = `Stock (${stock}) is below Safety Threshold (${safetyStock}). High risk of patient stockout.`;
  } else if (stock <= reorderPoint) {
    status = "REORDER_RECOMMENDED";
    recommendedRestock = Math.min(eoq, maxStockCap - stock);
    reason = `Stock (${stock}) has reached Reorder Point (${reorderPoint}). Restock advised before delivery lead time.`;
  } else if (stock >= maxStockCap) {
    status = "OVERSTOCK_WARNING";
    recommendedRestock = 0;
    reason = `Current stock (${stock}) exceeds Anti-Overstock Ceiling (${maxStockCap}). Restock suppressed to preserve capital.`;
  }

  return {
    currentStock: stock,
    demandVelocity,
    safetyStock,
    reorderPoint,
    maxStockCap,
    recommendedRestock: Math.max(0, recommendedRestock),
    status,
    reason,
  };
}
