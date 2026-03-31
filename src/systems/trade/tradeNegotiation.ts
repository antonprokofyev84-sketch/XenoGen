import type {
  InteractionEffectDescriptor,
  InteractionServiceRule,
} from '@/types/interaction.types';
import type { TradeNegotiationInfo } from '@/types/trade.types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const BASE_TRADE_EXPERIENCE = 0.5;
export const MINIMUM_TRADE_VALUE = 10;

export function calculateNegotiationWindow(
  expectedPrice: number,
  baseCost: number,
  tradeSkill: number,
): { fullWindow: number; availableWindow: number; minimumNegotiatedPrice: number } {
  const fullWindow = expectedPrice - baseCost;
  const effectiveTradeSkill = clamp(tradeSkill, 0, 100);
  const availableWindow = fullWindow * (effectiveTradeSkill / 100);
  const minimumNegotiatedPrice = Math.max(baseCost, expectedPrice - availableWindow);

  return { fullWindow, availableWindow, minimumNegotiatedPrice };
}

export function calculateSatisfaction(
  offeredPrice: number,
  minimumNegotiatedPrice: number,
  expectedPrice: number,
): number {
  if (minimumNegotiatedPrice >= expectedPrice) {
    return offeredPrice >= expectedPrice ? 1 : 0;
  }

  const satisfaction =
    (offeredPrice - minimumNegotiatedPrice) / (expectedPrice - minimumNegotiatedPrice);

  return clamp(satisfaction, 0, 1);
}

export function getFailureConsequences(satisfaction: number): InteractionEffectDescriptor[] {
  if (satisfaction >= 0.4) {
    return [{ type: 'modifyTension', delta: 5 }];
  }

  if (satisfaction >= 0.1) {
    return [{ type: 'modifyTension', delta: 15 }];
  }

  // Insult zone
  return [
    { type: 'modifyTension', delta: 25 },
    { type: 'modifyFactionReputation', delta: -3 },
    { type: 'modifyTargetAffection', delta: -5 },
  ];
}

/**
 * Calculate trade skill experience gain for a trade attempt.
 *
 * - difficultyFactor: hard successes and near-success failures teach more
 * - outcomeFactor: failure gives slightly less exp
 * - valueFactor: sqrt of trade value for diminishing returns on large deals
 * - repetitionMultiplier: halves each trade with same trader, floors at 12.5%
 */
export function calculateTradeExperienceGain({
  satisfaction,
  success,
  tradeValue,
  tradesWithThisTraderToday,
}: {
  satisfaction: number;
  success: boolean;
  tradeValue: number;
  tradesWithThisTraderToday: number;
}): number {
  if (tradeValue < MINIMUM_TRADE_VALUE) return 0;

  const difficultyFactor = success ? 1 - satisfaction : satisfaction;
  const outcomeFactor = success ? 1 : 0.75;
  const valueFactor = Math.sqrt(tradeValue);
  const repetitionMultiplier = Math.max(0.125, 1 / Math.pow(2, tradesWithThisTraderToday));

  return (
    BASE_TRADE_EXPERIENCE * difficultyFactor * outcomeFactor * valueFactor * repetitionMultiplier
  );
}

/**
 * Build a service rule override for a trade offer attempt.
 *
 * Maps satisfaction (0..1) to difficulty so that resolveService path 4
 * (pure d100 vs difficulty) produces: acceptChance = satisfaction.
 *
 * difficulty = (1 - satisfaction) * 100
 * resolveService: roll <= 100 - difficulty = roll <= satisfaction * 100
 */
export function buildTradeOfferRule(
  satisfaction: number,
  tradeValue: number,
  tradesWithThisTraderToday: number,
): Partial<InteractionServiceRule> {
  const difficulty = Math.round((1 - clamp(satisfaction, 0, 1)) * 100);

  const successExp = calculateTradeExperienceGain({
    satisfaction,
    success: true,
    tradeValue,
    tradesWithThisTraderToday,
  });

  const failureExp = calculateTradeExperienceGain({
    satisfaction,
    success: false,
    tradeValue,
    tradesWithThisTraderToday,
  });

  const onSuccess: InteractionEffectDescriptor[] =
    successExp > 0 ? [{ type: 'modifySkill', skill: 'trade', delta: successExp }] : [];

  const onFail: InteractionEffectDescriptor[] = [
    ...getFailureConsequences(satisfaction),
    ...(failureExp > 0
      ? [{ type: 'modifySkill' as const, skill: 'trade' as const, delta: failureExp }]
      : []),
  ];

  return {
    difficulty,
    onSuccess,
    onFail,
  };
}

/**
 * Compute full negotiation info for a trade offer.
 * Used by the UI to display acceptance chance and by the trade flow to build the rule override.
 */
export function evaluateTradeNegotiation(
  offeredPrice: number,
  expectedPrice: number,
  baseCost: number,
  tradeSkill: number,
): TradeNegotiationInfo {
  const { fullWindow, availableWindow, minimumNegotiatedPrice } = calculateNegotiationWindow(
    expectedPrice,
    baseCost,
    tradeSkill,
  );

  const satisfaction = calculateSatisfaction(offeredPrice, minimumNegotiatedPrice, expectedPrice);

  return {
    baseCost,
    expectedPrice,
    offeredPrice,
    fullWindow,
    availableWindow,
    minimumNegotiatedPrice,
    satisfaction,
  };
}
