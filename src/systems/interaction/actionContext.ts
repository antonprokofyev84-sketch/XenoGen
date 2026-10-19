import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import type { StoreState } from '@/state/useGameState';
import { resolvePoiRegionLevels } from '@/systems/world/regionLevels';
import type { ActionContext } from '@/types/action.types';
import type { QuestVarValue } from '@/types/condition.types';
import type { FrameId } from '@/types/ids.types';
import type { InteractionContextIds } from '@/types/interactionRuntime.types';
import { resolveSubjectKey } from '@/types/interactionRuntime.types';
import { isRunningQuest } from '@/types/questRuntime.types';
import type { ResolvedRegionLevels } from '@/types/region.types';
import { REGION_PARAMETER_KEYS } from '@/types/region.types';
import { isCellNode, isNonCellNode } from '@/types/worldNode.types';

import { resolveNpcEffectiveRelation } from './effectiveRelation';

/**
 * Сборка read-only facade для числовых функций контента.
 *
 * Контент не получает сырой `StoreState`, поэтому форма store остаётся
 * свободной. Facade собирается один раз на операцию и переиспользуется всеми
 * резолверами этой операции.
 */

const EMPTY_REGION_LEVELS: ResolvedRegionLevels = Object.fromEntries(
  REGION_PARAMETER_KEYS.map((key) => [key, 0]),
) as ResolvedRegionLevels;

/** Итоговые уровни POI; у клетки и неизвестного узла уровни нулевые. */
export function resolveContextRegionLevels(state: StoreState, poiId: string): ResolvedRegionLevels {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || !isNonCellNode(poi)) return EMPTY_REGION_LEVELS;

  const rootCell = state.poiSlice.pois[poi.rootCellId];
  if (!rootCell || !isCellNode(rootCell)) return EMPTY_REGION_LEVELS;

  return resolvePoiRegionLevels(
    rootCell.details.regionParameters,
    POI_TEMPLATES[poi.templateId] ?? {},
  );
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

export function buildActionContext(
  state: StoreState,
  context: InteractionContextIds,
  frameId: FrameId,
): ActionContext {
  const { poiId, slotId, npcId } = context;
  const subjectKey = resolveSubjectKey(context);

  return {
    poiId,
    slotId,
    npcId,
    frameId,
    regionLevels: resolveContextRegionLevels(state, poiId),
    currentNpcAffection: npcId === undefined ? undefined : state.npcSlice.byId[npcId]?.affection,
    effectiveRelation: npcId === undefined ? undefined : resolveNpcEffectiveRelation(state, npcId),
    tension: state.interactionSlice.dailyMemoryBySubject[subjectKey]?.tension,
    getQuestVar: (questId, key) => getQuestVar(state, questId, key),
  };
}
