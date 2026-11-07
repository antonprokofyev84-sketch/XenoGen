import { useState } from 'react';

import { useGameState } from '@/state/useGameState';
import type { InteractionPresentation } from '@/systems/interaction/presentation';
import type { ResolvedInteractionOptions, UiAction } from '@/systems/interaction/resolveOptions';
import type { CurrentInteraction } from '@/types/interactionRuntime.types';

import { ActionList } from './ActionList';
import { NarrativeView } from './NarrativeView';
import { PoiIcon } from './PoiIcon';

export function PoiInteractionPanel({
  interaction,
  presentation,
  actions,
  navigation,
  suspended,
  onHistory,
}: {
  interaction: CurrentInteraction;
  presentation: InteractionPresentation;
  actions: readonly UiAction[];
  navigation: ResolvedInteractionOptions['navigation'];
  suspended: boolean;
  onHistory: () => void;
}) {
  const [requestedPage, setPage] = useState(0);
  const performAction = useGameState((state) => state.interactionSlice.actions.performAction);
  const continueInteraction = useGameState(
    (state) => state.interactionSlice.actions.continueInteraction,
  );
  const returnToPoi = useGameState((state) => state.interactionSlice.actions.returnToPoiContext);
  const travel = useGameState((state) => state.world.actions.travelToPoi);
  const reading = interaction.reading;
  const pages = Math.max(1, Math.ceil(actions.length / 6));
  const page = Math.min(requestedPage, pages - 1);
  const parent = navigation.poiTransitions.find((route) => route.direction === 'parent');
  const canExit = navigation.canReturnToPoi || parent !== undefined;
  const sceneTitle = presentation.name
    ? `${presentation.name}${presentation.role && presentation.role !== presentation.name ? ' · ' + presentation.role : ''}`
    : presentation.title !== presentation.locationTitle
      ? presentation.title
      : undefined;
  return (
    <section className="poiInteractionPanel poiMetalPanel" aria-label="Interaction">
      <header className="poiInteractionHeader">
        {sceneTitle && <h1>{sceneTitle}</h1>}
        <div className="poiInteractionControls">
          {reading.mode === 'actions' && pages > 1 && (
            <nav className="poiActionPager" aria-label="Action pages">
              <button
                type="button"
                className="game-button"
                aria-label="Previous actions"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <PoiIcon name="previous" />
              </button>
              <span>
                {page + 1}/{pages}
              </span>
              <button
                type="button"
                className="game-button"
                aria-label="Next actions"
                disabled={page === pages - 1}
                onClick={() => setPage(page + 1)}
              >
                <PoiIcon name="next" />
              </button>
            </nav>
          )}
          <button type="button" className="game-button" onClick={onHistory}>
            History <PoiIcon name="history" />
          </button>
          {canExit && (
            <button
              type="button"
              className="game-button"
              data-testid={navigation.canReturnToPoi ? 'return-to-poi' : 'leave-poi'}
              disabled={reading.mode === 'narrative' || suspended}
              onClick={() => {
                if (navigation.canReturnToPoi) returnToPoi();
                else if (parent) travel(parent.poiId);
              }}
            >
              {navigation.canReturnToPoi ? 'End talk' : 'Leave'}
              <PoiIcon name="back" />
            </button>
          )}
        </div>
      </header>
      <div className="poiInteractionBody">
        {reading.mode === 'narrative' ? (
          <NarrativeView
            key={interaction.log.length}
            blocks={reading.blocks}
            onContinue={continueInteraction}
            suspended={suspended}
          />
        ) : (
          <ActionList options={actions.slice(page * 6, (page + 1) * 6)} onSelect={performAction} />
        )}
      </div>
    </section>
  );
}
