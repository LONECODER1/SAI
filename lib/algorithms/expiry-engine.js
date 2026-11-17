/**
 * Intelligent Expiry Alert & Flash-Sale Clearance Engine
 * Evaluates pharmaceutical shelf life, classifies risk tiers, and calculates liquidation pricing.
 */

export const EXPIRY_STATUS = {
  SAFE: "SAFE",
  APPROACHING_EXPIRY: "APPROACHING_EXPIRY",
  CRITICAL_EXPIRY: "CRITICAL_EXPIRY",
  EXPIRED: "EXPIRED",
};

/**
 * Calculates remaining days until expiry.
 * @param {Date|string} expiryDate Expiry date of the medicine batch
 * @param {Date} [currentDate=new Date()] Optional reference date for testing
 * @returns {number} Days remaining (negative if expired)
 */
export function getRemainingExpiryDays(expiryDate, currentDate = new Date()) {
  if (!expiryDate) return Infinity;

  const exp = new Date(expiryDate);
  const cur = new Date(currentDate);

  if (isNaN(exp.getTime())) {
    throw new Error("Invalid expiry date provided");
  }

  const diffMs = exp.getTime() - cur.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates pharmaceutical expiry status based on days remaining.
 * @param {Date|string} expiryDate Expiry date of the medicine batch
 * @param {Date} [currentDate=new Date()] Optional reference date
 * @returns {{ status: string, daysRemaining: number, label: string, color: string, isEligibleForFlashSale: boolean }}
 */
export function evaluateExpiryStatus(expiryDate, currentDate = new Date()) {
  const days = getRemainingExpiryDays(expiryDate, currentDate);

  if (days <= 0) {
    return {
      status: EXPIRY_STATUS.EXPIRED,
      daysRemaining: days,
      label: "Expired (Do Not Dispense)",
      color: "red",
      isEligibleForFlashSale: false,
    };
  }

  if (days <= 30) {
    return {
      status: EXPIRY_STATUS.CRITICAL_EXPIRY,
      daysRemaining: days,
      label: `Critical: ${days} days left`,
      color: "red",
      isEligibleForFlashSale: true,
    };
  }

  if (days <= 90) {
    return {
      status: EXPIRY_STATUS.APPROACHING_EXPIRY,
      daysRemaining: days,
      label: `Approaching Expiry: ${days} days left`,
      color: "amber",
      isEligibleForFlashSale: days <= 60,
    };
  }

  return {
    status: EXPIRY_STATUS.SAFE,
    daysRemaining: days,
    label: `Safe (${days} days)`,
    color: "emerald",
    isEligibleForFlashSale: false,
  };
}

/**
 * Calculates flash clearance liquidation price for near-expiry products.
 * @param {number} originalPrice Retail selling price
 * @param {number} discountPercentage Discount percentage (default 50%)
 * @returns {{ flashSalePrice: number, savings: number, discountPercentage: number }}
 */
export function calculateFlashSalePrice(originalPrice, discountPercentage = 50) {
  const price = Number(originalPrice);
  const discount = Number(discountPercentage);

  if (isNaN(price) || price < 0) {
    throw new Error("Original price must be a non-negative number");
  }
  if (isNaN(discount) || discount < 0 || discount > 100) {
    throw new Error("Discount percentage must be between 0 and 100");
  }

  const flashSalePrice = Math.round(price * (1 - discount / 100) * 100) / 100;
  const savings = Math.round((price - flashSalePrice) * 100) / 100;

  return {
    flashSalePrice,
    savings,
    discountPercentage: discount,
  };
}
