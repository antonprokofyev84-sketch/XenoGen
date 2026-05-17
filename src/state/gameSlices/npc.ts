import { TIME_OF_DAY_SLOT_COUNT } from '@/constants';
import type { StoreState } from '@/state/useGameState';
import type { InteractionService } from '@/types/interaction.types';
import type { NpcDetails, NpcSchedule, NpcScheduleAction } from '@/types/npc.types';

import type { GameSlice } from '../types';

const isValidNpcScheduleSlot = (slot: number) => slot >= 0 && slot < TIME_OF_DAY_SLOT_COUNT;

export interface NpcSlice {
  byId: Record<string, NpcDetails>;
  actions: {
    initializeNpcs: (npcs: NpcDetails[]) => void;
    addNpc: (npc: NpcDetails) => void;
    removeNpc: (npcId: string) => void;
    clearAllNpcs: () => void;
    setNpcAffection: (npcId: string, affection: number) => void;
    setNpcLastDateMet: (npcId: string, lastDateMet: number | null) => void;
    setNpcServices: (npcId: string, services: InteractionService[]) => void;
    setNpcSchedule: (npcId: string, schedule: NpcSchedule) => void;
    setNpcScheduleAction: (npcId: string, slot: number, action: NpcScheduleAction) => void;
  };
}

export const npcSelectors = {
  selectNpcById:
    (npcId: string) =>
    (state: StoreState): NpcDetails | undefined =>
      state.npcSlice.byId[npcId],

  selectNpcAffection:
    (npcId: string) =>
    (state: StoreState): number | undefined =>
      state.npcSlice.byId[npcId]?.affection,

  selectNpcFactionId:
    (npcId: string) =>
    (state: StoreState): string | undefined =>
      state.npcSlice.byId[npcId]?.factionId,

  selectNpcServices:
    (npcId: string) =>
    (state: StoreState): InteractionService[] =>
      state.npcSlice.byId[npcId]?.services ?? [],

  selectNpcSchedule:
    (npcId: string) =>
    (state: StoreState): NpcSchedule | undefined =>
      state.npcSlice.byId[npcId]?.schedule,

  selectNpcScheduleAction:
    (npcId: string, slot: number) =>
    (state: StoreState): NpcScheduleAction | undefined =>
      state.npcSlice.byId[npcId]?.schedule[slot]?.action,
};

const initializeNpcsDraft = (state: StoreState, npcs: NpcDetails[]) => {
  state.npcSlice.byId = Object.fromEntries(npcs.map((npc) => [npc.id, npc]));
};

const addNpcDraft = (state: StoreState, npc: NpcDetails) => {
  state.npcSlice.byId[npc.id] = npc;
};

const removeNpcDraft = (state: StoreState, npcId: string) => {
  delete state.npcSlice.byId[npcId];
};

const clearAllNpcsDraft = (state: StoreState) => {
  state.npcSlice.byId = {};
};

const setNpcAffectionDraft = (state: StoreState, npcId: string, affection: number) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;
  npc.affection = affection;
};

const setNpcLastDateMetDraft = (state: StoreState, npcId: string, lastDateMet: number | null) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;
  npc.lastDateMet = lastDateMet;
};

const setNpcServicesDraft = (state: StoreState, npcId: string, services: InteractionService[]) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;
  npc.services = services;
};

const setNpcScheduleDraft = (state: StoreState, npcId: string, schedule: NpcSchedule) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc) return;
  npc.schedule = schedule;
};

const setNpcScheduleActionDraft = (
  state: StoreState,
  npcId: string,
  slot: number,
  action: NpcScheduleAction,
) => {
  const npc = state.npcSlice.byId[npcId];
  if (!npc || !isValidNpcScheduleSlot(slot)) return;
  npc.schedule[slot] = { action };
};

export const npcDraft = {
  initializeNpcs: initializeNpcsDraft,
  addNpc: addNpcDraft,
  removeNpc: removeNpcDraft,
  clearAllNpcs: clearAllNpcsDraft,
  setNpcAffection: setNpcAffectionDraft,
  setNpcLastDateMet: setNpcLastDateMetDraft,
  setNpcServices: setNpcServicesDraft,
  setNpcSchedule: setNpcScheduleDraft,
  setNpcScheduleAction: setNpcScheduleActionDraft,
};

export const createNpcSlice: GameSlice<NpcSlice> = (set) => ({
  byId: {},
  actions: {
    initializeNpcs: (npcs) =>
      set((state) => {
        initializeNpcsDraft(state, npcs);
      }),

    addNpc: (npc) =>
      set((state) => {
        addNpcDraft(state, npc);
      }),

    removeNpc: (npcId) =>
      set((state) => {
        removeNpcDraft(state, npcId);
      }),

    clearAllNpcs: () =>
      set((state) => {
        clearAllNpcsDraft(state);
      }),

    setNpcAffection: (npcId, affection) =>
      set((state) => {
        setNpcAffectionDraft(state, npcId, affection);
      }),

    setNpcLastDateMet: (npcId, lastDateMet) =>
      set((state) => {
        setNpcLastDateMetDraft(state, npcId, lastDateMet);
      }),

    setNpcServices: (npcId, services) =>
      set((state) => {
        setNpcServicesDraft(state, npcId, services);
      }),

    setNpcSchedule: (npcId, schedule) =>
      set((state) => {
        setNpcScheduleDraft(state, npcId, schedule);
      }),

    setNpcScheduleAction: (npcId, slot, action) =>
      set((state) => {
        setNpcScheduleActionDraft(state, npcId, slot, action);
      }),
  },
});
