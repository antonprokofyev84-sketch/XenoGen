import textData from '@/locales/en.json';
import { interactionSelectors, useGameState } from '@/state/useGameState';
import { resolveNarrativeText } from '@/systems/narrative/narrativeResolver';
import type { InteractionLogEvent } from '@/types/interaction.types';

import { EffectsSummary } from './EffectsSummary';

import './InteractionLogItem.scss';

interface InteractionLogItemProps {
  log: InteractionLogEvent;
}

export const InteractionLogItem = ({ log }: InteractionLogItemProps) => {
  const currentInteraction = useGameState(interactionSelectors.selectCurrentInteraction);
  const narrativeText = resolveNarrativeText(log, {
    npcId: currentInteraction?.npcId,
    factionId: currentInteraction?.factionId,
    poiType: currentInteraction?.poiType,
    tension: log.tension,
  });
  const statLabel = log.roll?.stat
    ? // @ts-ignore
      textData.mainStats?.[log.roll.stat] ||
      // @ts-ignore
      textData.skills?.[log.roll.stat] ||
      log.roll.stat
    : textData.interactionLog.reputation;
  const resultLabel =
    log.success === true ? textData.interactionLog.success : textData.interactionLog.fail;
  const rollSummary = log.roll ? (
    <span className="interactionLogSummary">
      [{statLabel} {textData.interactionLog.check}:{' '}
      <span className={`interactionLogResult ${log.success ? 'success' : 'fail'}`}>
        {resultLabel}
      </span>{' '}
      ( {log.roll.rollValue} vs {log.roll.targetValue} )]
    </span>
  ) : null;

  return (
    <div className="interactionLogItem">
      <div className="interactionLogHeader">
        {rollSummary}
        <span className="interactionLogNarrative">{narrativeText}</span>
      </div>
      <EffectsSummary effects={log.effects} />
    </div>
  );
};
