import type { TradeBalance } from '@/types/trade.types';

import './TradeSummary.scss';

interface TradeSummaryProps {
  playerTotal: number;
  traderTotal: number;
  onCancel: () => void;
  onReset: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  hasAnyOffer: boolean;
}

function evaluateBalance(playerTotal: number, traderTotal: number): TradeBalance {
  if (traderTotal === 0 && playerTotal === 0) return 'fair';
  if (traderTotal === 0) return 'unfavorable';
  const ratio = playerTotal / traderTotal;
  if (ratio <= 0.9) return 'favorable';
  if (ratio <= 1.1) return 'fair';
  return 'unfavorable';
}

const BALANCE_LABELS: Record<TradeBalance, string> = {
  favorable: 'Favorable',
  fair: 'Fair Trade',
  unfavorable: 'Unfavorable',
};

export const TradeSummary = ({
  playerTotal,
  traderTotal,
  onCancel,
  onReset,
  onConfirm,
  canConfirm,
  hasAnyOffer,
}: TradeSummaryProps) => {
  const difference = traderTotal - playerTotal;
  const balance = evaluateBalance(playerTotal, traderTotal);

  return (
    <div className="tradeSummary">
      <div className="summaryValues">
        <div className="summaryBlock">
          <span className="summaryLabel">You offer</span>
          <span className="summaryAmount">${playerTotal}</span>
        </div>

        <div className={`summaryBlock balanceIndicator ${balance}`}>
          <span className="balanceLabel">{BALANCE_LABELS[balance]}</span>
          <span className="balanceDiff">
            {difference >= 0 ? '+' : ''}
            {difference}
          </span>
        </div>

        <div className="summaryBlock">
          <span className="summaryLabel">They offer</span>
          <span className="summaryAmount">${traderTotal}</span>
        </div>
      </div>

      <div className="summaryActions">
        <button className="tradeBtn cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="tradeBtn reset" onClick={onReset} disabled={!hasAnyOffer}>
          Reset Offer
        </button>
        <button className="tradeBtn confirm" onClick={onConfirm} disabled={!canConfirm}>
          Confirm Trade
        </button>
      </div>
    </div>
  );
};
