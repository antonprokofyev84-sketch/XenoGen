import './EffectsSummary.scss';

interface EffectsSummaryProps {
  effectSummaryItems: string[];
}

export const EffectsSummary = ({ effectSummaryItems }: EffectsSummaryProps) => {
  if (!effectSummaryItems.length) return null;

  return <div className="effectsSummary">{effectSummaryItems.join(', ')}</div>;
};
