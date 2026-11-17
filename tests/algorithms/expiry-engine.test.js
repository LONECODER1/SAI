import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExpiryStatus,
  calculateFlashSalePrice,
  EXPIRY_STATUS,
} from "../../lib/algorithms/expiry-engine.js";

describe("Intelligent Expiry Alert & Flash-Sale Engine", () => {
  const baseDate = new Date("2026-11-20T00:00:00.000Z");

  it("should classify expired medicine when date is past or today", () => {
    const expiredDate = new Date("2026-11-19T00:00:00.000Z");
    const result = evaluateExpiryStatus(expiredDate, baseDate);
    assert.equal(result.status, EXPIRY_STATUS.EXPIRED);
    assert.equal(result.isEligibleForFlashSale, false);
  });

  it("should trigger CRITICAL_EXPIRY alert when within 30 days", () => {
    const nearExpiryDate = new Date("2026-12-05T00:00:00.000Z"); // 15 days left
    const result = evaluateExpiryStatus(nearExpiryDate, baseDate);
    assert.equal(result.status, EXPIRY_STATUS.CRITICAL_EXPIRY);
    assert.equal(result.daysRemaining, 15);
    assert.equal(result.isEligibleForFlashSale, true);
  });

  it("should trigger APPROACHING_EXPIRY when between 31 and 90 days", () => {
    const approachingDate = new Date("2027-01-10T00:00:00.000Z"); // ~51 days left
    const result = evaluateExpiryStatus(approachingDate, baseDate);
    assert.equal(result.status, EXPIRY_STATUS.APPROACHING_EXPIRY);
    assert.equal(result.isEligibleForFlashSale, true); // <= 60 days
  });

  it("should classify as SAFE when shelf life > 90 days", () => {
    const safeDate = new Date("2027-05-20T00:00:00.000Z"); // ~180 days left
    const result = evaluateExpiryStatus(safeDate, baseDate);
    assert.equal(result.status, EXPIRY_STATUS.SAFE);
    assert.equal(result.isEligibleForFlashSale, false);
  });

  it("should correctly compute flash-sale 50% liquidation discount", () => {
    const originalPrice = 120;
    const { flashSalePrice, savings, discountPercentage } = calculateFlashSalePrice(
      originalPrice,
      50
    );
    assert.equal(flashSalePrice, 60);
    assert.equal(savings, 60);
    assert.equal(discountPercentage, 50);
  });
});
