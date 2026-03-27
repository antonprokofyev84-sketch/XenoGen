/**
 * Trade pricing system.
 *
 * Prices are determined by two factors:
 * 1. effectiveRelation (clamped to -100..100) — defines the base trade multiplier
 * 2. tension (0..100) — temporary modifier, always makes trades worse for the player
 *
 * Relation anchor points (buy = player buying, sell = player selling):
 *   relation -100 → buy 250%, sell 40%
 *   relation    0 → buy 200%, sell 50%
 *   relation  100 → buy 110%, sell 90%
 *
 * Tension adds up to ±10% on top of the relation-adjusted price.
 */

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Linearly interpolate between two values */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- Anchor points ---
// [relation, buyMultiplier, sellMultiplier]
const ANCHORS = {
  buy: { low: 2.5, mid: 2.0, high: 1.1 },
  sell: { low: 0.4, mid: 0.5, high: 0.9 },
} as const;

const MAX_TENSION_EFFECT = 0.1; // 10%

function getRelationMultiplier(effectiveRelation: number, isBuying: boolean): number {
  const rel = clamp(effectiveRelation, -100, 100);
  const anchors = isBuying ? ANCHORS.buy : ANCHORS.sell;

  if (rel <= 0) {
    // Interpolate from low (-100) to mid (0)
    const t = (rel + 100) / 100; // 0 at -100, 1 at 0
    return lerp(anchors.low, anchors.mid, t);
  }

  // Interpolate from mid (0) to high (100)
  const t = rel / 100; // 0 at 0, 1 at 100
  return lerp(anchors.mid, anchors.high, t);
}

function getTensionModifier(tension: number, isBuying: boolean): number {
  const t = clamp(tension, 0, 100) / 100; // 0..1
  const effect = t * MAX_TENSION_EFFECT; // 0..0.10

  // Buying: tension increases price → multiplier > 1
  // Selling: tension decreases price → multiplier < 1
  return isBuying ? 1 + effect : 1 - effect;
}

/**
 * Returns the combined buy multiplier (relation + tension).
 * Multiply by base price to get the final buy price.
 */
export function getBuyMultiplier(effectiveRelation: number, tension: number): number {
  return getRelationMultiplier(effectiveRelation, true) * getTensionModifier(tension, true);
}

/**
 * Returns the combined sell multiplier (relation + tension).
 * Multiply by base price to get the final sell price.
 */
export function getSellMultiplier(effectiveRelation: number, tension: number): number {
  return getRelationMultiplier(effectiveRelation, false) * getTensionModifier(tension, false);
}

export function calculateBuyPrice(
  basePrice: number,
  effectiveRelation: number,
  tension: number,
): number {
    const buyMul = getBuyMultiplier(effectiveRelation, tension);
    return Math.round(basePrice * buyMul);
}

export function calculateSellPrice(
  basePrice: number,
  effectiveRelation: number,
  tension: number,
): number {
    const sellMul = getSellMultiplier(effectiveRelation, tension);
    return Math.round(basePrice * sellMul);
}

export interface TradePriceBreakdown {
  basePrice: number;
  relationMultiplier: number;
  tensionMultiplier: number;
  finalPrice: number;
}

export function getTradePriceBreakdown(
  basePrice: number,
  effectiveRelation: number,
  tension: number,
  isBuying: boolean,
): TradePriceBreakdown {
  const relationMultiplier = getRelationMultiplier(effectiveRelation, isBuying);
  const tensionMultiplier = getTensionModifier(tension, isBuying);
  const finalPrice = Math.round(basePrice * relationMultiplier * tensionMultiplier);

  return { basePrice, relationMultiplier, tensionMultiplier, finalPrice };
}
