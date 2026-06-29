import type { InteractionLogEvent } from '@/types/interaction.types';

import { EffectsSummary } from './EffectsSummary';
import { NarrativeContent } from './NarrativeContent';
import { RollSummary } from './RollSummary';

import './InteractionLogItem.scss';

interface InteractionLogItemProps {
  log: InteractionLogEvent;
}

export const InteractionLogItem = ({ log }: InteractionLogItemProps) => {
  if (!log) return null;
  const { roll, narrativeBlocks, effectSummaryItems } = log;
  const hasRoll = roll !== undefined;
  const hasNarrativeBlocks = narrativeBlocks !== undefined && narrativeBlocks.length > 0;
  const hasEffectSummaryItems = effectSummaryItems !== undefined && effectSummaryItems.length > 0;
  if (!hasRoll && !hasNarrativeBlocks && !hasEffectSummaryItems) return null;

  return (
    <div className="interactionLogItem">
      {hasRoll && <RollSummary success={log.success} roll={roll} />}
      {hasNarrativeBlocks && (
        <NarrativeContent action={log.action} narrativeBlocks={narrativeBlocks} />
      )}
      {hasEffectSummaryItems && <EffectsSummary effectSummaryItems={effectSummaryItems} />}
    </div>
  );
};
