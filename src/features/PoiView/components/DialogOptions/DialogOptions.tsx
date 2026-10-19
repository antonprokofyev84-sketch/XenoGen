import { interactionSelectors, useGameState } from '@/state/useGameState';
import type { UiAction } from '@/systems/interaction/resolveOptions';
import { POI_TRANSITION_BLOCK_LABELS } from '@/systems/interaction/resolveOptions';

import './DialogOptions.scss';

interface ActionGroupProps {
  title: string;
  options: readonly UiAction[];
  onSelect: (actionId: string) => void;
}

const ActionGroup = ({ title, options, onSelect }: ActionGroupProps) =>
  options.length === 0 ? null : (
    <div className="dialogOptionsGroup">
      <h5 className="dialogOptionsGroupTitle">{title}</h5>

      <div className="dialogOptionsList">
        {options.map((option) => (
          <button
            key={option.actionId}
            type="button"
            className="dialogOption"
            onClick={() => onSelect(option.actionId)}
            disabled={option.isDisabled}
            data-testid={`action-${option.actionId}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

/**
 * Варианты текущего экрана.
 *
 * Группы приходят из runtime-resolvera, поэтому UI не знает ни про
 * конкретные ID служб, ни про их стоимость и время: любой выбор уходит в
 * единый исполнитель Actions либо в мировую команду перехода.
 */
export const DialogOptions = () => {
  const options = useGameState(interactionSelectors.selectInteractionOptions);
  const performAction = useGameState((state) => state.interactionSlice.actions.performAction);
  const enterSlotContext = useGameState((state) => state.interactionSlice.actions.enterSlotContext);
  const returnToPoiContext = useGameState(
    (state) => state.interactionSlice.actions.returnToPoiContext,
  );
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);

  const { frame, poi, slot, personal, quest } = options.actions;
  const { npcSlots, poiTransitions, canReturnToPoi } = options.navigation;

  // Дочерние POI показывает сцена: здесь остаётся только выход наружу.
  const parentTransitions = poiTransitions.filter(
    (transition) => transition.direction === 'parent',
  );

  const hasNavigation = npcSlots.length > 0 || canReturnToPoi || parentTransitions.length > 0;

  return (
    <div className="dialogOptions">
      <ActionGroup title="Actions" options={frame} onSelect={performAction} />
      <ActionGroup title="Place" options={poi} onSelect={performAction} />
      <ActionGroup title="Role" options={slot} onSelect={performAction} />
      <ActionGroup title="Personal" options={personal} onSelect={performAction} />
      <ActionGroup title="Quest" options={quest} onSelect={performAction} />

      {hasNavigation && (
        <div className="dialogOptionsGroup">
          <h5 className="dialogOptionsGroupTitle">Navigation</h5>

          <div className="dialogOptionsList">
            {npcSlots.map((npcSlot) => (
              <button
                key={npcSlot.slotId}
                type="button"
                className="dialogOption"
                onClick={() => enterSlotContext(npcSlot.slotId, npcSlot.npcId)}
                data-testid={`slot-${npcSlot.slotId}`}
              >
                {npcSlot.name}
              </button>
            ))}

            {canReturnToPoi && (
              <button
                type="button"
                className="dialogOption"
                onClick={returnToPoiContext}
                data-testid="return-to-poi"
              >
                Закончить разговор
              </button>
            )}

            {parentTransitions.map((transition) => (
              <button
                key={transition.poiId}
                type="button"
                className="dialogOption"
                onClick={() => travelToPoi(transition.poiId)}
                disabled={transition.isDisabled}
                data-testid={`travel-${transition.poiId}`}
              >
                {transition.blockReason
                  ? `${transition.label} — ${POI_TRANSITION_BLOCK_LABELS[transition.blockReason]}`
                  : transition.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
