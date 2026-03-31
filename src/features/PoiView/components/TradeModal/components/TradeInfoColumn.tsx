import { useMemo } from 'react';

import { calculateNegotiationWindow } from '@/systems/trade/tradeNegotiation';

import './TradeInfoColumn.scss';

// =====================================================================
// Types
// =====================================================================

interface TradeInfoColumnProps {
  effectiveRelation: number;
  tension: number;
  playerTotal: number;
  traderTotal: number;
  satisfaction: number;
  lastResult: 'success' | 'fail' | null;
  hasAnyOffer: boolean;
  onCancel: () => void;
  onReset: () => void;
  onConfirm: () => void;
  onQuickFill: (playerMoney: number, traderMoney: number) => void;
  // Quick-fill calculation inputs
  playerMoneyOffer: number;
  traderMoneyOffer: number;
  playerItemsValue: number; // playerTotal - playerMoneyOffer
  traderItemsExpected: number; // traderTotal - traderMoneyOffer
  traderItemsBase: number; // traderBaseCost - traderMoneyOffer
  tradeSkill: number;
  maxPlayerMoney: number; // playerContainer.money
  maxTraderMoney: number; // traderContainer.money
}

type ChanceZone = 'safe' | 'risky' | 'dangerous' | 'insult';

// =====================================================================
// Helpers
// =====================================================================

function getChanceZone(satisfaction: number): ChanceZone {
  if (satisfaction < 0.1) return 'insult';
  if (satisfaction < 0.4) return 'dangerous';
  if (satisfaction < 0.8) return 'risky';
  return 'safe';
}

const ZONE_LABELS: Record<ChanceZone, string> = {
  safe: 'Almost certain',
  risky: 'Risky',
  dangerous: 'Unlikely',
  insult: 'Insulting offer',
};

const QUICK_FILL_TARGETS = [0.5, 0.75, 0.9, 1] as const;

interface QuickFillResult {
  playerMoney: number;
  traderMoney: number;
  feasible: boolean;
}

/**
 * Calculate bidirectional money adjustment to reach target satisfaction.
 *
 * satisfaction = (P + pm - M) / (E - M)   where M = minimumNegotiatedPrice
 *
 * Since M is computed from E (trader items expected) and B (trader items base),
 * and money is additive to both the offered price and expected price,
 * we can derive the needed (pm - tm) delta.
 *
 * offeredPrice  = P + pm   (player items value + player money)
 * expectedPrice = E + tm   (trader items expected + trader money, since trader money
 *                            is part of the trader offer total, and buy multiplier
 *                            doesn't apply to money)
 *
 * Wait — actually let's re-derive from the actual functions:
 *
 * playerTotal = playerItemsValue + pm
 * traderTotal = traderItemsExpected + tm
 * traderBaseCost = traderItemsBase + tm
 *
 * evaluateTradeNegotiation(playerTotal, traderTotal, traderBaseCost, tradeSkill):
 *   expectedPrice = traderTotal = E + tm
 *   baseCost = traderBaseCost = B + tm
 *   fullWindow = (E + tm) - (B + tm) = E - B  (money cancels!)
 *   availableWindow = (E - B) * skill / 100
 *   minNegPrice = max(B + tm, (E + tm) - availableWindow)
 *                = max(B + tm, (E - availableWindow) + tm)
 *
 *   Let M0 = max(B, E - availableWindow)  — constant, independent of tm
 *   Then minNegPrice = M0 + tm
 *
 *   satisfaction = (playerTotal - minNegPrice) / (expectedPrice - minNegPrice)
 *               = (P + pm - M0 - tm) / (E + tm - M0 - tm)
 *               = (P + pm - M0 - tm) / (E - M0)
 *
 * So: S = (P + pm - tm - M0) / (E - M0)
 * Solve for (pm - tm): pm - tm = S * (E - M0) - P + M0
 *
 * Strategy:
 *   delta = targetDiff - currentDiff   where diff = pm - tm
 *   If delta > 0 (need more from player side):
 *     - First reduce tm (give back trader money), then increase pm
 *   If delta < 0 (need less from player side):
 *     - First reduce pm (give back player money), then increase tm
 */
function calculateQuickFill(
  targetSatisfaction: number,
  playerItemsValue: number,
  traderItemsExpected: number,
  traderItemsBase: number,
  tradeSkill: number,
  currentPlayerMoney: number,
  currentTraderMoney: number,
  maxPlayerMoney: number,
  maxTraderMoney: number,
): QuickFillResult {
  const { availableWindow } = calculateNegotiationWindow(
    traderItemsExpected,
    traderItemsBase,
    tradeSkill,
  );

  const M0 = Math.max(traderItemsBase, traderItemsExpected - availableWindow);
  const denominator = traderItemsExpected - M0;

  // No negotiation window — satisfaction is binary
  if (denominator <= 0) {
    return { playerMoney: currentPlayerMoney, traderMoney: currentTraderMoney, feasible: false };
  }

  const targetDiff = targetSatisfaction * denominator - playerItemsValue + M0;
  const currentDiff = currentPlayerMoney - currentTraderMoney;
  const delta = Math.ceil(targetDiff - currentDiff);

  let pm = currentPlayerMoney;
  let tm = currentTraderMoney;

  if (delta > 0) {
    // Need to increase (pm - tm): reduce tm first, then increase pm
    const reduceFromTm = Math.min(tm, delta);
    tm -= reduceFromTm;
    const remaining = delta - reduceFromTm;
    pm += remaining;

    if (pm > maxPlayerMoney) {
      return { playerMoney: pm, traderMoney: tm, feasible: false };
    }
  } else if (delta < 0) {
    // Need to decrease (pm - tm): reduce pm first, then increase tm
    const absDelta = -delta;
    const reduceFromPm = Math.min(pm, absDelta);
    pm -= reduceFromPm;
    const remaining = absDelta - reduceFromPm;
    tm += remaining;

    if (tm > maxTraderMoney) {
      return { playerMoney: pm, traderMoney: tm, feasible: false };
    }
  }

  return { playerMoney: Math.max(0, pm), traderMoney: Math.max(0, tm), feasible: true };
}

// =====================================================================
// Component
// =====================================================================

export const TradeInfoColumn = ({
  effectiveRelation,
  tension,
  playerTotal,
  traderTotal,
  satisfaction,
  lastResult,
  hasAnyOffer,
  onCancel,
  onReset,
  onConfirm,
  onQuickFill,
  playerMoneyOffer,
  traderMoneyOffer,
  playerItemsValue,
  traderItemsExpected,
  traderItemsBase,
  tradeSkill,
  maxPlayerMoney,
  maxTraderMoney,
}: TradeInfoColumnProps) => {
  const difference = traderTotal - playerTotal;
  const chancePercent = Math.round(satisfaction * 100);
  const zone = getChanceZone(satisfaction);

  const quickFillResults = useMemo(
    () =>
      QUICK_FILL_TARGETS.map((target) =>
        calculateQuickFill(
          target,
          playerItemsValue,
          traderItemsExpected,
          traderItemsBase,
          tradeSkill,
          playerMoneyOffer,
          traderMoneyOffer,
          maxPlayerMoney,
          maxTraderMoney,
        ),
      ),
    [
      playerItemsValue,
      traderItemsExpected,
      traderItemsBase,
      tradeSkill,
      playerMoneyOffer,
      traderMoneyOffer,
      maxPlayerMoney,
      maxTraderMoney,
    ],
  );

  return (
    <div className="tradeInfoColumn">
      {/* Title + Close */}
      <div className="infoHeader">
        <h2 className="tradeTitle">Trade</h2>
        <button className="closeBtn" onClick={onCancel}>
          X
        </button>
      </div>

      {/* Context: Relation & Tension */}
      <div className="infoContext">
        <div className="contextRow">
          <span className="contextLabel">Relation</span>
          <span className="contextValue">{Math.round(effectiveRelation)}</span>
        </div>
        <div className="contextRow">
          <span className="contextLabel">Tension</span>
          <span className="contextValue">{Math.round(tension)}</span>
        </div>
      </div>

      {/* Offer Totals */}
      <div className="infoTotals">
        <div className="totalBlock">
          <span className="totalLabel">You offer</span>
          <span className="totalAmount">${playerTotal}</span>
        </div>
        <div className="totalBlock">
          <span className="totalLabel">They offer</span>
          <span className="totalAmount">${traderTotal}</span>
        </div>
        <div className="totalBlock diff">
          <span className="totalLabel">Difference</span>
          <span className={`totalAmount ${difference >= 0 ? 'positive' : 'negative'}`}>
            {difference >= 0 ? '+' : ''}
            {difference}
          </span>
        </div>
      </div>

      {/* Satisfaction Indicator */}
      <div className={`infoChance ${zone}`}>
        <span className="chanceLabel">{ZONE_LABELS[zone]}</span>
        <span className="chancePercent">{chancePercent}%</span>
      </div>

      {/* Quick-fill Buttons */}
      <div className="quickFillRow">
        {QUICK_FILL_TARGETS.map((target, i) => (
          <button
            key={target}
            className="quickFillBtn"
            disabled={!quickFillResults[i].feasible || !hasAnyOffer}
            onClick={() =>
              onQuickFill(quickFillResults[i].playerMoney, quickFillResults[i].traderMoney)
            }
          >
            {Math.round(target * 100)}%
          </button>
        ))}
      </div>

      {/* Trade Result */}
      {lastResult && (
        <div className={`tradeResult ${lastResult}`}>
          {lastResult === 'success' ? 'Trade accepted!' : 'Trade rejected.'}
        </div>
      )}

      {/* Action Buttons */}
      <div className="infoActions">
        <button className="tradeBtn reset" onClick={onReset} disabled={!hasAnyOffer}>
          Reset
        </button>
        <button className={`tradeBtn confirm ${zone}`} onClick={onConfirm} disabled={!hasAnyOffer}>
          Propose
        </button>
        <button className="tradeBtn cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};
