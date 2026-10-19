import { useShallow } from 'zustand/react/shallow';

import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import type { NpcOverlay } from '@/systems/interaction/presentation';
import {
  POI_TRANSITION_BLOCK_LABELS,
  resolvePoiDisplayName,
} from '@/systems/interaction/resolveOptions';
import { resolvePoiImage } from '@/systems/poi/poiImageResolver';
import { isNonCellNode } from '@/types/worldNode.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './ImagePanel.scss';

interface NpcOverlaySlotProps {
  overlay: NpcOverlay;
  side: 'left' | 'right';
}

const NpcOverlaySlot = ({ overlay, side }: NpcOverlaySlotProps) => (
  <div
    className={`npcOverlay npcOverlay--${side} ${overlay.isSpeaking ? 'npcOverlay--speaking' : ''}`}
    data-testid={`npc-overlay-${overlay.npcId}`}
  >
    {overlay.imageUrl !== undefined && <img src={overlay.imageUrl} alt={overlay.name} />}
    <span className="npcOverlayName">{overlay.name}</span>
  </div>
);

/**
 * Сцена взаимодействия.
 *
 * Фон задаёт текущий Frame и наследует предыдущий, если своего у него нет.
 * Контекстный NPC стоит справа, говорящий — слева; подсвечивается тот, чья
 * реплика сейчас последняя в логе.
 *
 * Навигация по дочерним POI приходит из резолвера вариантов, поэтому панель
 * не обходит дерево мира сама и не знает про бывшие локальные точки.
 */
export const ImagePanel = () => {
  // Селектор мемоизован, ссылка стабильна — дополнительное сравнение не нужно.
  const presentation = useGameState(interactionSelectors.selectPresentation);

  // А здесь `filter` создаёт новый массив, поэтому сравнение нужно: его элементы
  // приходят из мемоизованных опций и сохраняют ссылки.
  const childTransitions = useGameState(
    useShallow((state) =>
      interactionSelectors
        .selectInteractionOptions(state)
        .navigation.poiTransitions.filter((transition) => transition.direction === 'child'),
    ),
  );
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);

  const poiId = useGameState(
    (state) => interactionSelectors.selectCurrentInteraction(state)?.poiId ?? null,
  );
  const poi = useGameState((state) => (poiId ? poiSelectors.selectPoiById(poiId)(state) : null));
  const templateId = poi && isNonCellNode(poi) ? poi.templateId : null;

  const backgroundUrl = assetsVersion(
    presentation.background ?? resolvePoiImage(templateId ?? 'unknown', poiId, null),
  );

  return (
    <div className="imagePanel">
      <div className="imageContainer">
        <div className="poiImage">
          <img
            key={backgroundUrl}
            src={backgroundUrl}
            alt={resolvePoiDisplayName(templateId ?? 'unknown')}
            onLoad={(event) => {
              event.currentTarget.style.visibility = 'visible';
            }}
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />
          <div className="vignette" />

          {presentation.speakerNpc && (
            <NpcOverlaySlot overlay={presentation.speakerNpc} side="left" />
          )}
          {presentation.contextNpc && (
            <NpcOverlaySlot overlay={presentation.contextNpc} side="right" />
          )}
        </div>

        {childTransitions.length > 0 && (
          <div className="subPoiStrip">
            {childTransitions.map((transition) => (
              <button
                key={transition.poiId}
                type="button"
                className="subPoiCard"
                disabled={transition.isDisabled}
                onClick={() => travelToPoi(transition.poiId)}
                data-testid={`sub-poi-${transition.poiId}`}
              >
                <span className="subPoiCardName">{transition.label}</span>

                {transition.blockReason && (
                  <span className="subPoiCardBlockReason">
                    {POI_TRANSITION_BLOCK_LABELS[transition.blockReason]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
