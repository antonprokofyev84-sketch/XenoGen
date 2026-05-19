import textData from '@/locales/en.json';
import { interactionSelectors, useGameState } from '@/state/useGameState';
import { resolveNarrativeBlocks } from '@/systems/narrative/narrativeResolver';
import type { InteractionLogEvent } from '@/types/interaction.types';

import { EffectsSummary } from './EffectsSummary';

import './InteractionLogItem.scss';

interface InteractionLogItemProps {
  log: InteractionLogEvent;
}

export const InteractionLogItem = ({ log }: InteractionLogItemProps) => {
  const currentInteraction = useGameState(interactionSelectors.selectCurrentInteraction);
  const mainStatLabels = textData.mainStats as Record<string, string> | undefined;
  const skillLabels = textData.skills as Record<string, string> | undefined;
  const narrativeBlocks = resolveNarrativeBlocks(log, {
    npcId: currentInteraction?.npcId,
    poiId: currentInteraction?.poiId,
    poiType: currentInteraction?.poiType,
    hasOwner: currentInteraction?.hasOwner,
    tension: log.tension,
  });
  const statLabel = log.roll?.stat
    ? mainStatLabels?.[log.roll.stat] || skillLabels?.[log.roll.stat] || log.roll.stat
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

  const narrativeContent = (
    <div className="interactionLogNarrative">
      {narrativeBlocks.map((block, index) =>
        typeof block === 'string' ? (
          <p key={`${log.action}-text-${index}`} className="interactionLogParagraph">
            {block}
          </p>
        ) : (
          <div key={`${log.action}-dialogue-${index}`} className="interactionLogDialogueLine">
            <span className="interactionLogSpeaker">{block.speaker}:</span>
            <span className="interactionLogDialogueText">{block.text}</span>
          </div>
        ),
      )}
    </div>
  );

  return (
    <div className="interactionLogItem">
      {rollSummary ? <div className="interactionLogHeader">{rollSummary}</div> : null}
      {narrativeContent}
      <EffectsSummary effects={log.effects} />
    </div>
  );
};
