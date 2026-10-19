import type { StoreState } from '@/state/useGameState';
import type { NpcId } from '@/types/ids.types';
import type { InitialNpc, InitialNpcMap } from '@/types/npcContent.types';
import type { RuntimeNpc, RuntimeNpcMap } from '@/types/npcRuntime.types';
import { diffCalendarDays } from '@/utils/diffCalendarDays';

import type { GameSlice } from '../types';

/**
 * Изменяемое состояние NPC: отношения и история встреч.
 *
 * Неизменные данные личности сюда не копируются: они читаются из
 * `INITIAL_NPCS` по тому же ключу. Текущее место NPC принадлежит occupancy,
 * а характеристики и боевой билд — отдельным character/stat templates.
 */
export interface NpcSlice {
  byId: RuntimeNpcMap;

  actions: {
    /** Создаёт runtime-записи для всех авторских NPC. */
    initializeNpcs: (npcs: InitialNpcMap) => void;
    clearAllNpcs: () => void;
    setNpcAffection: (npcId: string, affection: number) => void;
    /** Фиксирует состоявшуюся встречу; `timesMet` растёт не чаще раза в день. */
    registerNpcMeeting: (npcId: string) => void;
  };
}

export const npcSelectors = {
  selectNpcById:
    (npcId: string) =>
    (state: StoreState): RuntimeNpc | undefined =>
      state.npcSlice.byId[npcId],
};

const createRuntimeNpc = (npcId: NpcId, initial: InitialNpc): RuntimeNpc => ({
  id: npcId,
  affection: initial.affection ?? 0,
  timesMet: initial.timesMet ?? 0,
  lastDateMet: null,
});

const initializeNpcsDraft = (state: StoreState, npcs: InitialNpcMap) => {
  state.npcSlice.byId = Object.fromEntries(
    Object.entries(npcs).map(([npcId, npc]) => [npcId, createRuntimeNpc(npcId, npc)]),
  );
};

const clearAllNpcsDraft = (state: StoreState) => {
  state.npcSlice.byId = {};
};

const setNpcAffectionDraft = (state: StoreState, npcId: string, affection: number) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;

  npc.affection = affection;
};

/**
 * Встречей считается выход из взаимодействия с NPC в недочерний контекст, а
 * не простое присутствие NPC в occupancy. Повторные взаимодействия в тот же
 * календарный день обновляют только `lastDateMet`, поэтому отдельная дневная
 * map не нужна.
 */
const registerNpcMeetingDraft = (state: StoreState, npcId: string) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;

  const { currentTime } = state.world;

  if (npc.lastDateMet === null || diffCalendarDays(npc.lastDateMet, currentTime) > 0) {
    npc.timesMet += 1;
  }

  npc.lastDateMet = currentTime;
};

export const npcDraft = {
  initializeNpcs: initializeNpcsDraft,
  clearAllNpcs: clearAllNpcsDraft,
  setNpcAffection: setNpcAffectionDraft,
  registerNpcMeeting: registerNpcMeetingDraft,
};

export const createNpcSlice: GameSlice<NpcSlice> = (set) => ({
  byId: {},

  actions: {
    initializeNpcs: (npcs) =>
      set((state) => {
        initializeNpcsDraft(state, npcs);
      }),

    clearAllNpcs: () =>
      set((state) => {
        clearAllNpcsDraft(state);
      }),

    setNpcAffection: (npcId, affection) =>
      set((state) => {
        setNpcAffectionDraft(state, npcId, affection);
      }),

    registerNpcMeeting: (npcId) =>
      set((state) => {
        registerNpcMeetingDraft(state, npcId);
      }),
  },
});
