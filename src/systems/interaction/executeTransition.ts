import { worldDraft } from '@/state/gameSlices/world';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import type { ActionTransition } from '@/types/action.types';
import { isNpcContext } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { resolveCurrentRootFrameId } from './frameIds';
import {
  endNpcConversation,
  finishInteractionStep,
  openFrame,
  openRootFrame,
} from './interactionState';

/** Перемещает ли переход партию: такие случаи идут через мировое действие. */
function resolveTravelTarget(state: StoreState, transition: ActionTransition): string | undefined {
  if (transition.type === 'poi') return transition.poiId;

  if (transition.type === 'parentPoi') {
    // Исполнитель вызван до travel: исходный interaction ещё не завершён.
    const interaction = state.interactionSlice.currentInteraction!;
    const poi = state.poiSlice.pois[interaction.poiId];
    return poi && isNonCellNode(poi) ? poi.parentId : undefined;
  }

  return undefined;
}

/** Применяет переход внутри interaction, не перемещая партию. */
function applyLocalTransition(state: StoreState, transition: ActionTransition, rng: Rng): void {
  // Локальное ожидание сохраняет interaction; travel обрабатывается отдельно до этого вызова.
  const interaction = state.interactionSlice.currentInteraction!;
  switch (transition.type) {
    case 'frame': {
      const rootFrameId = resolveCurrentRootFrameId(state);
      if (transition.frameId === rootFrameId) {
        openRootFrame(state);
      } else {
        openFrame(state, transition.frameId);
      }
      return;
    }

    case 'root': {
      openRootFrame(state, { readNarrative: false });
      return;
    }

    case 'currentPoi': {
      // Завершение разговора возвращает тот же interaction в POI root.
      if (isNpcContext(interaction)) {
        endNpcConversation(state, rng);
      } else {
        openRootFrame(state, { readNarrative: false });
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

/** Извлекает обязательный переход до его исполнения, затем продолжает сценарий. */
export function executePendingTransition(state: StoreState, rng: Rng): void {
  // Continue продолжает исходный interaction; до исполнения перехода он сохраняется в state.
  const interaction = state.interactionSlice.currentInteraction!;
  // continueInteraction вызывает исполнитель только в ветке с существующим pendingTransition.
  const transition = state.interactionSlice.pendingTransition!;
  state.interactionSlice.pendingTransition = null;
  const duration = transition.time ?? 0;
  const travelTargetId = resolveTravelTarget(state, transition);
  const sourcePoi = state.poiSlice.pois[interaction.poiId];

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

  applyLocalTransition(state, transition, rng);
  finishInteractionStep(state, rng);
}
