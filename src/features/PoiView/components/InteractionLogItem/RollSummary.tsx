import textData from '@/locales/en.json';
import type { InteractionLogEvent } from '@/types/interaction.types';

import './RollSummary.scss';

interface RollSummaryProps {
  success?: boolean;
  roll: InteractionLogEvent['roll'];
}

export const RollSummary = ({ success, roll }: RollSummaryProps) => {
  const { rollValue, targetValue, stat } = roll || {};
  const mainStatLabels = textData.mainStats as Record<string, string> | undefined;
  const skillLabels = textData.skills as Record<string, string> | undefined;
  const statLabel = stat
    ? mainStatLabels?.[stat] || skillLabels?.[stat] || stat
    : textData.interactionLog.reputation;
  const resultLabel =
    success === true ? textData.interactionLog.success : textData.interactionLog.fail;

  return (
    <div className="interactionLogHeader">
      <span className="interactionLogSummary">
        [{statLabel} {textData.interactionLog.check}:{' '}
        <span className={`interactionLogResult ${success ? 'success' : 'fail'}`}>
          {resultLabel}
        </span>{' '}
        ( {rollValue} vs {targetValue} )]
      </span>
    </div>
  );
};
