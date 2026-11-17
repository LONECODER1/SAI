import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateDemandVelocity,
  calculateReorderThresholds,
  calculateAntiOverstockCeiling,
  evaluateRestockRecommendation,
} from "../../lib/algorithms/smart-stock.js";

describe("SmartStock Demand & Anti-Overstocking Algorithm", () => {
  it("should calculate demand velocity based on calibrated weights", () => {
    // 28 prescriptions, 14 searches, 14 sales over 14 days
    // daily: rx=2.0, searches=1.0, sales=1.0
    // velocity: 0.50*2.0 + 0.20*1.0 + 0.30*1.0 = 1.0 + 0.2 + 0.3 = 1.5 units/day
    const velocity = calculateDemandVelocity({
      prescriptions: 28,
      searches: 14,
      storeSales: 14,
      windowDays: 14,
    });
    assert.equal(velocity, 1.5);
  });

  it("should calculate correct reorder point and safety stock", () => {
    const demandVelocity = 2.0; // 2 units/day
    const leadTime = 2; // 2 days lead time
    const { safetyStock, reorderPoint } = calculateReorderThresholds(
      demandVelocity,
      leadTime
    );
    // leadTimeDemand = 2.0 * 2 = 4
    // safetyStock = ceil(1.65 * 1.2 * sqrt(2)) = ceil(2.8) = 3
    // reorderPoint = 4 + 3 = 7
    assert.ok(safetyStock > 0);
    assert.ok(reorderPoint > safetyStock);
  });

  it("should enforce the anti-overstock ceiling to suppress excess purchasing", () => {
    const recommendation = evaluateRestockRecommendation({
      currentStock: 150, // High stock
      prescriptions: 10,
      searches: 5,
      storeSales: 5,
      leadTimeDays: 2,
    });

    assert.equal(recommendation.status, "OVERSTOCK_WARNING");
    assert.equal(recommendation.recommendedRestock, 0);
    assert.match(recommendation.reason, /preserves capital|exceeds/i);
  });

  it("should recommend restock with safety cap when stock is critically low", () => {
    const recommendation = evaluateRestockRecommendation({
      currentStock: 2, // Very low stock
      prescriptions: 35, // High doctor prescription surge
      searches: 20,
      storeSales: 15,
      leadTimeDays: 2,
    });

    assert.equal(recommendation.status, "CRITICAL_LOW");
    assert.ok(recommendation.recommendedRestock > 0);
    assert.ok(
      recommendation.currentStock + recommendation.recommendedRestock <=
        recommendation.maxStockCap
    );
  });
});
