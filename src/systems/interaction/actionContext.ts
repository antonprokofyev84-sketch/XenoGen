import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import type { StoreState } from '@/state/useGameState';
import { resolvePoiRegionLevels } from '@/systems/world/regionLevels';
import type { ActionContext } from '@/types/action.types';
import type { QuestVarValue } from '@/types/condition.types';
import { isRunningQuest } from '@/types/questRuntime.types';
import type { ResolvedRegionLevels } from '@/types/region.types';
import type { CellNode, NonCellPoiNode } from '@/types/worldNode.types';

import { readCurrentInteractionTension } from './dailyMemory';
import { resolveCurrentNpcEffectiveRelation } from './effectiveRelation';

/**
 * Сборка read-only facade для числовых функций контента.
 *
 * Контент не получает сырой `StoreState`, поэтому форма store остаётся
 * свободной. Facade собирается один раз на операцию и переиспользуется всеми
 * резолверами этой операции.
 */

/** Итоговые уровни текущего POI. */
function resolveCurrentRegionLevels(state: StoreState): ResolvedRegionLevels {
  // Interaction существует только для non-cell POI с существующей root cell.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId] as NonCellPoiNode;
  const rootCell = state.poiSlice.pois[poi.rootCellId] as CellNode;

  return resolvePoiRegionLevels(rootCell.details.regionParameters, POI_TEMPLATES[poi.templateId]);
}

export function getQuestVar(
  state: StoreState,
  questId: string,
  key: string,
): QuestVarValue | undefined {
  const quest = state.questSlice.questsById[questId];
  if (!quest || !isRunningQuest(quest)) return undefined;

  return quest.vars[key];
}

export function buildActionContext(state: StoreState): ActionContext {
  // Action, Interceptor или resolver вызывают builder только для текущего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  const { poiId, slotId, npcId } = interaction;

  return {
    poiId,
    slotId,
    npcId,
    frameId: interaction.activeFrameId,
    regionLevels: resolveCurrentRegionLevels(state),
    currentNpcAffection: npcId === undefined ? undefined : state.npcSlice.byId[npcId].affection,
    effectiveRelation: resolveCurrentNpcEffectiveRelation(state),
    tension: readCurrentInteractionTension(state),
    getQuestVar: (questId, key) => getQuestVar(state, questId, key),
  };
}
