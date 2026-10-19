import type { StoreState } from '@/state/useGameState';
import { RESERVED_FRAME_NAMES } from '@/types/frame.types';
import type { FrameId } from '@/types/ids.types';
import type { InteractionContextIds } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

/**
 * Разрешение ID системных Frames контекста.
 *
 * Контекст нельзя восстановить из строки `activeFrameId`, но обратное верно:
 * root-Frame выводится из `templateId` и `slotId`. Это ID definitions, а не
 * ID конкретного экземпляра POI или NPC.
 */

/** POI root — `templateId`; slot root — `templateId/slotId`. */
export function resolveRootFrameId(
  state: StoreState,
  context: InteractionContextIds,
): FrameId | undefined {
  const poi = state.poiSlice.pois[context.poiId];
  if (!poi || !isNonCellNode(poi)) return undefined;

  return context.slotId === undefined ? poi.templateId : `${poi.templateId}/${context.slotId}`;
}

/** Зарезервированный Frame принудительного выхода конкретного slot. */
export function resolveForceExitFrameId(
  state: StoreState,
  context: InteractionContextIds,
): FrameId | undefined {
  const rootFrameId = resolveRootFrameId(state, context);
  if (rootFrameId === undefined || context.slotId === undefined) return undefined;

  return `${rootFrameId}:${RESERVED_FRAME_NAMES.forceExit}`;
}
