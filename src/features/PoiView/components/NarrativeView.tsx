import { useEffect, useRef, useState } from 'react';

import text from '@/locales/en.json';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import { isDialogueLine, isThoughtLine } from '@/types/narrativeBlock.types';

export function NarrativeBlocks({ blocks }: { blocks: readonly NarrativeBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <p
          key={index}
          className={
            isThoughtLine(block) ? 'poiThought' : isDialogueLine(block) ? 'poiDialogue' : ''
          }
        >
          {isDialogueLine(block) ? `«${block.text}»` : isThoughtLine(block) ? block.thought : block}
        </p>
      ))}
    </>
  );
}
export function NarrativeView({
  blocks,
  onContinue,
  suspended,
}: {
  blocks: readonly NarrativeBlock[];
  onContinue: () => void;
  suspended: boolean;
}) {
  const [ready, setReady] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!ready || suspended) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.isComposing) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'button, input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      event.preventDefault();
      onContinue();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [ready, suspended, onContinue]);
  return (
    <div
      className={`poiNarrative ${ready ? 'isReady' : ''}`}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setReady(true);
      }}
      onPointerDown={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        if (!ready || suspended || event.detail > 1 || !window.getSelection()?.isCollapsed) return;
        if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 5)
          return;
        onContinue();
      }}
    >
      <div className="poiTextScroll" tabIndex={0} aria-label={text.interactionUi.interactionText}>
        <NarrativeBlocks blocks={blocks} />
      </div>
      <span className="poiContinueHint" aria-hidden="true">
        [ {text.interactionUi.continueHint} <span>▶</span> ]
      </span>
    </div>
  );
}
