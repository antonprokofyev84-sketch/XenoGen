import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import type { ActionId, PoiId, SlotId } from '@/types/ids.types';
import { isNpcContext } from '@/types/interactionRuntime.types';
import type { InitialNpcSlot } from '@/types/poiContent.types';
import type { NonCellPoiNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { evaluateConditions } from './conditions';
import { resolveAppearance } from './dailyMemory';
import { resolveCurrentRootFrameId } from './frameIds';

/**
 * Источники Actions текущего экрана.
 *
 * Группы разделены по источнику и не смешиваются: квестовые Actions POI не
 * подмешиваются в slot root, а персональные Actions NPC — в POI root.
 */

export interface ActionSources {
  frame: readonly ActionId[];
  poi: readonly ActionId[];
  slot: readonly ActionId[];
  personal: readonly ActionId[];
  quest: readonly ActionId[];
}

const EMPTY_SOURCES: ActionSources = { frame: [], poi: [], slot: [], personal: [], quest: [] };

/** Все slots шаблона POI в порядке групп одним списком. */
export function listSlotDefinitions(state: StoreState, poiId: PoiId): InitialNpcSlot[] {
  // Callers получают poiId из interaction или runtime-placement существующего NPC.
  const poi = state.poiSlice.pois[poiId] as NonCellPoiNode;

  return Object.values(POI_TEMPLATES[poi.templateId].npcSlots ?? {}).flat();
}

export function listCurrentSlotDefinitions(state: StoreState): InitialNpcSlot[] {
  // Вызывается только при отображении существующего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  return listSlotDefinitions(state, interaction.poiId);
}

export function findSlotDefinition(
  state: StoreState,
  poiId: PoiId,
  slotId: SlotId,
): InitialNpcSlot | undefined {
  return listSlotDefinitions(state, poiId).find((slot) => slot.id === slotId);
}

/** Definition slot текущего NPC-разговора. */
export function findCurrentSlotDefinition(state: StoreState): InitialNpcSlot {
  // startNpcConversation устанавливает slotId из портрета существующего slot.
  const interaction = state.interactionSlice.currentInteraction!;
  return findSlotDefinition(state, interaction.poiId, interaction.slotId as SlotId)!;
}

export function listCurrentActionSources(state: StoreState): ActionSources {
  // Источники собираются только для экрана текущего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId] as NonCellPoiNode;

  const frame = INITIAL_FRAMES[interaction.activeFrameId].actionIds ?? [];

  // Внутренний Frame показывает только собственные Actions.
  if (interaction.activeFrameId !== resolveCurrentRootFrameId(state)) {
    return { ...EMPTY_SOURCES, frame };
  }

  if (isNpcContext(interaction)) {
    return {
      frame,
      poi: [],
      slot: findCurrentSlotDefinition(state).actionIds ?? [],
      personal: INITIAL_NPCS[interaction.npcId].actionIds ?? [],
      quest: state.questSlice.questActionIdsByTarget[interaction.npcId] ?? [],
    };
  }

  return {
    frame,
    poi: POI_TEMPLATES[poi.templateId].actionIds ?? [],
    slot: [],
    personal: [],
    quest: state.questSlice.questActionIdsByTarget[interaction.poiId] ?? [],
  };
}

/**
 * Бросает дневные `appearanceChance` подходящих Actions показываемого экрана.
 *
 * Бросок принадлежит runtime-операции актуализации, а не React render и не
 * чистому selector: иначе результат менялся бы при каждой перерисовке.
 * Выполняется после того, как очередь событий определила фактический Frame.
 */
export function rollVisibleAppearanceChances(state: StoreState, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;
  const actionContext = buildActionContext(state);
  const sources = listCurrentActionSources(state);
  for (const actionId of Object.values(sources).flat()) {
    const action = INITIAL_ACTIONS[actionId];
    if (action.appearanceChance === undefined) continue;

    // Пока условия не выполнены, броска нет.
    if (!evaluateConditions(state, action.conditions, actionContext)) continue;

    resolveAppearance(state, 'actions', actionId, action.appearanceChance, actionContext, rng);
  }
}
