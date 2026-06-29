import type { NarrativeBlock } from '@/types/narrative.types';

import './NarrativeContent.scss';

interface NarrativeContentProps {
  action: string;
  narrativeBlocks: NarrativeBlock[];
}

export const NarrativeContent = ({ action, narrativeBlocks }: NarrativeContentProps) => {
  if (!narrativeBlocks.length) return null;

  return (
    <div className="interactionLogNarrative">
      {narrativeBlocks.map((block, index) =>
        typeof block === 'string' ? (
          <p key={`${action}-text-${index}`} className="interactionLogParagraph">
            {block}
          </p>
        ) : (
          <div key={`${action}-dialogue-${index}`} className="interactionLogDialogueLine">
            <span className="interactionLogSpeaker">{block.speaker}:</span>
            <span className="interactionLogDialogueText">{block.text}</span>
          </div>
        ),
      )}
    </div>
  );
};
