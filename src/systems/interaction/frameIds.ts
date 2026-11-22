import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import type { StoreState } from '@/state/useGameState';
import { RESERVED_FRAME_NAMES } from '@/types/frame.types';
import type { FrameId } from '@/types/ids.types';
import type { NonCellPoiNode } from '@/types/worldNode.types';

export function isContextExitFrame(frameId: FrameId): boolean {
  return (
    frameId === CONTEXT_EXIT_FRAMES.poiClosed ||
    frameId === CONTEXT_EXIT_FRAMES.npcLeft ||
    frameId === CONTEXT_EXIT_FRAMES.poiPendingRemoval
  );
}

/**
 * Разрешение ID системных Frames контекста.
 *
 * Контекст нельзя восстановить из строки `activeFrameId`, но обратное верно:
 * root-Frame выводится из `templateId` и `slotId`. Это ID definitions, а не
 * ID конкретного экземпляра POI или NPC.
 */

/** Root текущего POI либо текущего разговора. */
export function resolveCurrentRootFrameId(state: StoreState): FrameId {
  // Interaction создаётся только для существующего non-cell POI, а занятый POI
  // защищён от удаления до travel.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId] as NonCellPoiNode;

  return interaction.slotId === undefined
    ? poi.templateId
    : `${poi.templateId}/${interaction.slotId}`;
}

/** Зарезервированный Frame принудительного выхода текущего slot. */
export function resolveCurrentForceExitFrameId(state: StoreState): FrameId {
  return `${resolveCurrentRootFrameId(state)}:${RESERVED_FRAME_NAMES.forceExit}`;
}
