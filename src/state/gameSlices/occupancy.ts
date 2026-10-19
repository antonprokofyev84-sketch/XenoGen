import { INITIAL_NPCS } from '@/data/initial/npcs';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import type { StoreState } from '@/state/useGameState';
import { resolveNpcSchedules } from '@/systems/npc/npcSchedule';
import { resolvePoiSlotOccupancy } from '@/systems/npc/slotOccupancy';
import type { NpcId, SlotId } from '@/types/ids.types';
import type { NpcPlacement, OccupancyState } from '@/types/occupancy.types';
import { isNonCellNode } from '@/types/worldNode.types';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

import type { GameSlice } from '../types';

/**
 * Фактическое размещение NPC по slots.
 *
 * Resolved schedules строятся глобально при каждой смене time slot, а
 * occupancy разрешается **лениво**: POI, в который игрок не входил, не делает
 * бросков `chance` и не получает occupants. Внутри одного time slot
 * результат переиспользуется, поэтому повторный вход ничего не перебрасывает.
 */
export interface OccupancySlice extends OccupancyState {
  actions: {
    /** Пересчитывает schedules и сбрасывает фактическое размещение. */
    refreshOccupancy: () => void;
    /** Разрешает occupancy POI, если она ещё не разрешена в этом time slot. */
    ensurePoiOccupancy: (poiId: string) => void;
    assignNpcToSlot: (poiId: string, slotId: string, npcId: string) => void;
    clearSlotAssignment: (poiId: string, slotId: string) => void;
  };
}

export const occupancySelectors = {
  selectSlotOccupants:
    (poiId: string) =>
    (state: StoreState): Partial<Record<SlotId, NpcId>> =>
      state.occupancySlice.slotOccupants[poiId] ?? {},

  selectSlotOccupant:
    (poiId: string, slotId: string) =>
    (state: StoreState): NpcId | undefined =>
      state.occupancySlice.slotOccupants[poiId]?.[slotId],

  selectNpcPlacement:
    (npcId: string) =>
    (state: StoreState): NpcPlacement | undefined =>
      state.occupancySlice.npcPlacements[npcId],

  selectSlotAssignment:
    (poiId: string, slotId: string) =>
    (state: StoreState): NpcId | undefined =>
      state.occupancySlice.assignments[poiId]?.[slotId],
};

/** Сбрасывает только transient-слой: персональные назначения переживают смену time slot. */
const clearResolvedOccupancyDraft = (state: StoreState) => {
  state.occupancySlice.schedulesByNpcId = {};
  state.occupancySlice.slotOccupants = {};
  state.occupancySlice.npcPlacements = {};
  state.occupancySlice.resolvedPoiIds = {};
};

const resolveSchedulesDraft = (state: StoreState) => {
  state.occupancySlice.schedulesByNpcId = resolveNpcSchedules({
    npcsById: state.npcSlice.byId,
    npcContent: INITIAL_NPCS,
    nodesById: state.poiSlice.pois,
    templates: POI_TEMPLATES,
    assignments: state.occupancySlice.assignments,
    timeOfDay: resolveTimeOfDay(state.world.currentTime),
  });
};

const ensurePoiOccupancyDraft = (state: StoreState, poiId: string) => {
  if (state.occupancySlice.resolvedPoiIds[poiId]) return;

  const poi = state.poiSlice.pois[poiId];
  if (!poi || !isNonCellNode(poi) || poi.pendingRemoval) return;

  const occupantsBySlotId = resolvePoiSlotOccupancy({
    poiId,
    npcSlots: POI_TEMPLATES[poi.templateId]?.npcSlots,
    schedulesByNpcId: state.occupancySlice.schedulesByNpcId,
    assignments: state.occupancySlice.assignments,
    isNpcPlaced: (npcId) => state.occupancySlice.npcPlacements[npcId] !== undefined,
  });

  state.occupancySlice.resolvedPoiIds[poiId] = true;
  state.occupancySlice.slotOccupants[poiId] = occupantsBySlotId;

  for (const [slotId, npcId] of Object.entries(occupantsBySlotId)) {
    if (npcId === undefined) continue;

    state.occupancySlice.npcPlacements[npcId] = { poiId, slotId };
  }
};

/**
 * Назначение вступает в силу со следующего разрешения occupancy: внутри
 * текущего time slot occupants не пересчитываются.
 */
const assignNpcToSlotDraft = (state: StoreState, poiId: string, slotId: string, npcId: string) => {
  const poiAssignments = state.occupancySlice.assignments[poiId];

  if (poiAssignments) {
    poiAssignments[slotId] = npcId;
    return;
  }

  state.occupancySlice.assignments[poiId] = { [slotId]: npcId };
};

const clearSlotAssignmentDraft = (state: StoreState, poiId: string, slotId: string) => {
  const poiAssignments = state.occupancySlice.assignments[poiId];
  if (!poiAssignments) return;

  delete poiAssignments[slotId];

  if (Object.keys(poiAssignments).length === 0) {
    delete state.occupancySlice.assignments[poiId];
  }
};

export const occupancyDraft = {
  ensurePoiOccupancy: ensurePoiOccupancyDraft,
  assignNpcToSlot: assignNpcToSlotDraft,
  clearSlotAssignment: clearSlotAssignmentDraft,

  /**
   * Разрешает occupancy нового time slot.
   *
   * Якорем выступает текущая позиция партии: остальной мир остаётся
   * неразрешённым до фактического входа игрока.
   */
  refreshOccupancy: (state: StoreState) => {
    clearResolvedOccupancyDraft(state);
    resolveSchedulesDraft(state);
    ensurePoiOccupancyDraft(state, state.party.currentPartyPosition);
  },
};

export const createOccupancySlice: GameSlice<OccupancySlice> = (set) => ({
  assignments: {},
  schedulesByNpcId: {},
  slotOccupants: {},
  npcPlacements: {},
  resolvedPoiIds: {},

  actions: {
    refreshOccupancy: () =>
      set((state) => {
        occupancyDraft.refreshOccupancy(state);
      }),

    ensurePoiOccupancy: (poiId) =>
      set((state) => {
        ensurePoiOccupancyDraft(state, poiId);
      }),

    assignNpcToSlot: (poiId, slotId, npcId) =>
      set((state) => {
        assignNpcToSlotDraft(state, poiId, slotId, npcId);
      }),

    clearSlotAssignment: (poiId, slotId) =>
      set((state) => {
        clearSlotAssignmentDraft(state, poiId, slotId);
      }),
  },
});
