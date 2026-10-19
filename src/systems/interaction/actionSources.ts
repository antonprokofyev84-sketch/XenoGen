import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import type { ActionId } from '@/types/ids.types';
import type { CurrentInteraction } from '@/types/interactionRuntime.types';
import { isNpcContext, resolveSubjectKey } from '@/types/interactionRuntime.types';
import type { InitialNpcSlot } from '@/types/poiContent.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { evaluateConditions } from './conditions';
import { resolveAppearance } from './dailyMemory';
import { resolveRootFrameId } from './frameIds';

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
export function listSlotDefinitions(state: StoreState, poiId: string): InitialNpcSlot[] {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || !isNonCellNode(poi)) return [];

  return Object.values(POI_TEMPLATES[poi.templateId]?.npcSlots ?? {}).flat();
}

export function findSlotDefinition(
  state: StoreState,
  poiId: string,
  slotId: string,
): InitialNpcSlot | undefined {
  return listSlotDefinitions(state, poiId).find((slot) => slot.id === slotId);
}

export function listActionSources(
  state: StoreState,
  interaction: CurrentInteraction,
): ActionSources {
  const poi = state.poiSlice.pois[interaction.poiId];
  if (!poi || !isNonCellNode(poi)) return EMPTY_SOURCES;

  const frame = INITIAL_FRAMES[interaction.activeFrameId]?.actionIds ?? [];

  // Внутренний Frame показывает только собственные Actions.
  if (interaction.activeFrameId !== resolveRootFrameId(state, interaction)) {
    return { ...EMPTY_SOURCES, frame };
  }

  if (isNpcContext(interaction)) {
    return {
      frame,
      poi: [],
      slot: findSlotDefinition(state, interaction.poiId, interaction.slotId)?.actionIds ?? [],
      personal: INITIAL_NPCS[interaction.npcId]?.actionIds ?? [],
      quest: state.questSlice.questActionIdsByTarget[interaction.npcId] ?? [],
    };
  }

  return {
    frame,
    poi: POI_TEMPLATES[poi.templateId]?.actionIds ?? [],
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
  const subjectKey = resolveSubjectKey(interaction);
  const context = buildActionContext(state, interaction, interaction.activeFrameId);
  const sources = listActionSources(state, interaction);
  for (const actionId of Object.values(sources).flat()) {
    const action = INITIAL_ACTIONS[actionId];
    if (!action?.appearanceChance) continue;

    // Пока условия не выполнены, броска нет.
    if (!evaluateConditions(state, action.conditions, context)) continue;

    resolveAppearance(
      state,
      subjectKey,
      'actions',
      actionId,
      action.appearanceChance,
      context,
      rng,
    );
  }
}
