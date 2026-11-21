import { worldDraft } from '@/state/gameSlices/world';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import type { ActionTransition } from '@/types/action.types';
import type { InteractionContextIds } from '@/types/interactionRuntime.types';
import { isNpcContext } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { resolveRootFrameId } from './frameIds';
import { enterPoiContext, finishInteractionStep, openFrame } from './interactionState';

/** Перемещает ли переход партию: такие случаи идут через мировое действие. */
function resolveTravelTarget(
  state: StoreState,
  transition: ActionTransition,
  context: InteractionContextIds,
): string | undefined {
  if (transition.type === 'poi') return transition.poiId;

  if (transition.type === 'parentPoi') {
    const poi = state.poiSlice.pois[context.poiId];
    return poi && isNonCellNode(poi) ? poi.parentId : undefined;
  }

  return undefined;
}

/** Применяет переход внутри interaction, не перемещая партию. */
function applyLocalTransition(
  state: StoreState,
  transition: ActionTransition,
  context: InteractionContextIds,
  rng: Rng,
): void {
  switch (transition.type) {
    case 'frame':
      openFrame(state, transition.frameId);
      return;

    case 'root': {
      const rootFrameId = resolveRootFrameId(state, context);
      if (rootFrameId !== undefined) openFrame(state, rootFrameId, { readNarrative: false });
      return;
    }

    case 'currentPoi': {
      // Смена slot/NPC → POI не двигает партию, но начинает новый лог.
      if (isNpcContext(context)) {
        enterPoiContext(state, context.poiId, rng);
      } else {
        const rootFrameId = resolveRootFrameId(state, context);
        if (rootFrameId !== undefined) openFrame(state, rootFrameId, { readNarrative: false });
      }
      return;
    }

    case 'trade':
      state.interactionSlice.isTrading = true;
      return;

    case 'combat':
      console.warn('combat transition находится вне текущей миграции');
      return;

    default:
      return;
  }
}

/** Исполняет сохранённый переход после подтверждения текста либо при пустом результате. */
export function executePendingTransition(state: StoreState, rng: Rng): void {
  const transition = state.interactionSlice.pendingTransition;
  const context = state.interactionSlice.currentInteraction;
  if (!transition || !context) return;
  // Consume before execution: refreshing the world cannot execute this transition twice.
  state.interactionSlice.pendingTransition = null;
  const duration = transition.time ?? 0;
  const travelTargetId = resolveTravelTarget(state, transition, context);
  const sourcePoi = state.poiSlice.pois[context.poiId];

  // Пометка завершает контент: сохраняется только уже выбранный выход к родителю.
  if (
    sourcePoi &&
    isNonCellNode(sourcePoi) &&
    sourcePoi.pendingRemoval &&
    travelTargetId !== sourcePoi.parentId
  ) {
    finishInteractionStep(state, rng);
    return;
  }

  if (travelTargetId !== undefined) {
    worldDraft.travelToPoi(state, travelTargetId, transition.time);
    return;
  }

  if (duration > 0) worldDraft.advanceTime(state, duration);

  if (sourcePoi && isNonCellNode(sourcePoi) && sourcePoi.pendingRemoval) {
    finishInteractionStep(state, rng);
    return;
  }

  applyLocalTransition(state, transition, context, rng);
  finishInteractionStep(state, rng);
}
