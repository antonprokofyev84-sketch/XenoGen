import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import text from '@/locales/en.json';
import type { InteractionLogEntry } from '@/types/interactionRuntime.types';

import { NarrativeBlocks } from './NarrativeView';

export function InteractionHistory({
  log,
  onClose,
}: {
  log: readonly InteractionLogEntry[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="poiHistory poiTheme"
      aria-labelledby="poi-history-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="poiHistoryBody">
        <header>
          <h2 id="poi-history-title">{text.interactionUi.historyTitle}</h2>
          <button type="button" className="game-button" onClick={onClose} autoFocus>
            {text.interactionUi.close} ×
          </button>
        </header>
        <div className="poiHistoryScroll">
          {log.length === 0 ? (
            <p>{text.interactionUi.emptyHistory}</p>
          ) : (
            log.map((entry, index) => (
              <section key={index}>
                <NarrativeBlocks blocks={entry.blocks} />
              </section>
            ))
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
