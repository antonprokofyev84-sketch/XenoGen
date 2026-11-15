import { useState } from 'react';

import { GameTooltip } from '@/components/GameHud/GameTooltip';
import text from '@/locales/en.json';
import { useGameState } from '@/state/useGameState';
import type { NpcOverlay } from '@/systems/interaction/presentation';
import type { ResolvedInteractionOptions, UiNpcSlot } from '@/systems/interaction/resolveOptions';
import { POI_TRANSITION_BLOCK_LABELS } from '@/systems/interaction/resolveOptions';
import { resolveNpcPortrait, resolveNpcSilhouette } from '@/systems/npc/npcImageResolver';

import { PoiIcon } from './PoiIcon';

export function NpcFigure({ figure }: { figure: NpcOverlay }) {
  return figure.imageUrl ? (
    <div className="poiNpcFigure">
      <img
        src={figure.imageUrl}
        alt={figure.name}
        draggable={false}
        onError={(event) => {
          const fallback = resolveNpcSilhouette(figure.npcId);
          if (event.currentTarget.getAttribute('src') !== fallback)
            event.currentTarget.src = fallback;
        }}
      />
    </div>
  ) : null;
}

export function NpcPortraitGrid({
  slots,
  disabled,
  selectedNpcId,
  onSelect,
}: {
  slots: readonly UiNpcSlot[];
  disabled: boolean;
  selectedNpcId?: string;
  onSelect: (slotId: string, npcId: string) => void;
}) {
  const [requestedPage, setPage] = useState(() =>
    Math.floor(
      Math.max(
        0,
        slots.findIndex((slot) => slot.npcId === selectedNpcId),
      ) / 4,
    ),
  );
  const pages = Math.max(1, Math.ceil(slots.length / 4));
  const page = Math.min(requestedPage, pages - 1);
  return (
    <aside className="poiPortraitPanel poiMetalPanel" aria-label={text.interactionUi.characters}>
      <header>
        <h2>{text.interactionUi.characters}</h2>
        {pages > 1 && (
          <div className="poiPortraitPager">
            <button
              type="button"
              aria-label={text.interactionUi.previousCharacters}
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
              aria-label={text.interactionUi.nextCharacters}
              disabled={page === pages - 1}
              onClick={() => setPage(page + 1)}
            >
              <PoiIcon name="next" />
            </button>
          </div>
        )}
      </header>
      <div className="poiPortraitGrid">
        {Array.from({ length: 4 }, (_, index) => {
          const slot = slots[page * 4 + index];
          const portrait = slot ? resolveNpcPortrait(slot.npcId) : undefined;
          return slot ? (
            <GameTooltip key={slot.slotId} label={slot.name}>
              <button
                type="button"
                className="poiPortrait"
                disabled={disabled}
                aria-label={slot.name}
                aria-pressed={slot.npcId === selectedNpcId}
                onClick={() => {
                  if (slot.npcId !== selectedNpcId) onSelect(slot.slotId, slot.npcId);
                }}
                data-testid={`slot-${slot.slotId}`}
              >
                <span className="poiPortraitVisual">
                  {portrait ? (
                    <img src={portrait} alt="" width={56} height={56} />
                  ) : (
                    <PoiIcon name="person" />
                  )}
                </span>
                <span>{slot.name}</span>
              </button>
            </GameTooltip>
          ) : (
            <span key={`empty-${index}`} className="poiPortrait isEmpty" aria-hidden="true">
              <span className="poiPortraitVisual">
                <PoiIcon name="person" />
              </span>
            </span>
          );
        })}
      </div>
    </aside>
  );
}

export function PoiNavigation({
  navigation,
  disabled,
}: {
  navigation: ResolvedInteractionOptions['navigation'];
  disabled: boolean;
}) {
  const travel = useGameState((state) => state.world.actions.travelToPoi);
  const routes = navigation.poiTransitions.filter((route) => route.direction === 'child');
  if (!routes.length) return null;
  return (
    <aside className="poiNavigation poiMetalPanel" aria-label={text.interactionUi.destinations}>
      <h2>{text.interactionUi.destinations}</h2>
      <div className="poiRoutes">
        {routes.map((route) => (
          <GameTooltip
            key={route.poiId}
            label={`${route.label}${route.blockReason ? ' · ' + POI_TRANSITION_BLOCK_LABELS[route.blockReason] : ''}`}
          >
            <button
              type="button"
              className="game-button"
              disabled={disabled || route.isDisabled}
              onClick={() => travel(route.poiId)}
              data-testid={`travel-${route.poiId}`}
            >
              <PoiIcon name="map" />
              <span>
                {route.label}
                {route.blockReason && (
                  <small>{POI_TRANSITION_BLOCK_LABELS[route.blockReason]}</small>
                )}
              </span>
            </button>
          </GameTooltip>
        ))}
      </div>
    </aside>
  );
}
