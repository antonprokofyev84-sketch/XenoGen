import type { StoreState } from '@/state/useGameState';
import type { MainStatKey } from '@/types/character.types';
import type { Character } from '@/types/character.types';
import type { Captive } from '@/types/party.types';
import type { MovementMode } from '@/types/travel.types';

import type { GameSlice } from '../types';
import { characterSelectors } from './characters';

// const MAX_ROSTER_SIZE = 5;
const BASE_CAPTIVES_NUMBER = 2;
const BASE_PARTY_SIZE = 2;
const CHARISMA_PER_PARTY_SLOT = 40;
const STRENGTH_PER_CAPTIVE_SLOT = 80;
const NON_LEADER_STAT_PENALTY = 20;

export interface PartySlice {
  leaderId: string;
  memberIds: string[];
  reserveIds: string[];
  captives: Captive[];
  currentPartyPosition: string;
  previousPartyPosition: string | null;
  travelMode: MovementMode;
  morale: number;

  actions: {
    addMember: (characterId: string) => void;
    removeMember: (characterId: string) => void;
    moveToCell: (targetCellId: string) => void;
    setTravelMode: (mode: MovementMode) => void;
    changeStamina: (delta: number) => void;
    addCaptive: (captive: Captive) => void;
    removeCaptive: (captiveId: string) => void;
  };
}

// --- Селекторы ---

export const partySelectors = {
  selectAllMemberIds: (state: StoreState) => {
    return [...state.party.memberIds, ...state.party.reserveIds];
  },
  /** Возвращает полные данные всех членов отряда */
  selectAllPartyMembers: (state: StoreState) => {
    const allMembersIds = partySelectors.selectAllMemberIds(state);
    return allMembersIds.map((id) =>
      characterSelectors.selectCharacterById(id)(state),
    ) as Character[];
  },

  selectActivePartyMembers: (state: StoreState) => {
    return state.party.memberIds
      .map((id) => characterSelectors.selectCharacterById(id)(state))
      .filter((char): char is Character => !!char);
  },

  selectReserveMembers: (state: StoreState) => {
    return state.party.reserveIds
      .map((id) => characterSelectors.selectCharacterById(id)(state))
      .filter((char): char is Character => !!char);
  },

  /** Возвращает максимальный размер отряда, зависящий от Харизмы протагониста */
  selectMaxPartySize: (state: StoreState): number => {
    const partyLeaderId = state.party.leaderId;
    const partyLeader = characterSelectors.selectCharacterById(partyLeaderId)(state) as Character;

    return BASE_PARTY_SIZE + Math.floor(partyLeader.skills.charisma / CHARISMA_PER_PARTY_SLOT);
  },

  /** Возвращает максимальное количество пленников, зависящее от Силы отряда */
  selectMaxCaptives: (state: StoreState): number => {
    const partyMembers = partySelectors.selectAllPartyMembers(state);
    const totalStrength = partyMembers.reduce((sum, char) => sum + char.mainStats.str, 0);
    return BASE_CAPTIVES_NUMBER + Math.floor(totalStrength / STRENGTH_PER_CAPTIVE_SLOT);
  },
  /**
   * Вычисляет наивысшее эффективное значение характеристики в отряде для проверок.
   * Применяет штраф, если лучший персонаж - не протагонист.
   */
  selectHighestEffectiveMainStat:
    (stat: MainStatKey) =>
    (state: StoreState): number => {
      const partyLeaderId = state.party.leaderId;
      const partyMemberIds = partySelectors
        .selectAllMemberIds(state)
        .filter((id) => id !== partyLeaderId);

      const partyLeaderStat =
        characterSelectors.selectEffectiveMainStats(partyLeaderId)(state)[stat];

      let highestValue = partyLeaderStat;

      for (const memberId of partyMemberIds) {
        const effectiveStats = characterSelectors.selectEffectiveMainStats(memberId)(state);
        const statValue = effectiveStats[stat] - NON_LEADER_STAT_PENALTY; // Штраф для не-лидера
        if (statValue > highestValue) {
          highestValue = statValue;
        }
      }

      return highestValue;
    },
  selectIsPartyFatigued: (state: StoreState): boolean => {
    const partyMembers = partySelectors.selectAllPartyMembers(state);
    return partyMembers.some((member) => member.stamina < 0);
  },
};

export const createPartySlice: GameSlice<PartySlice> = (set, get) => ({
  memberIds: ['protagonist'], // Начинаем только с протагониста
  leaderId: 'protagonist',
  reserveIds: [],
  captives: [],
  currentPartyPosition: '3-1',
  previousPartyPosition: null,
  travelMode: 'foot',
  morale: 75,
  actions: {
    addMember: (characterId) =>
      set((state) => {
        const maxPartySize = partySelectors.selectMaxPartySize(state);
        const isAlreadyInParty = partySelectors.selectAllMemberIds(state).includes(characterId);
        if (state.party.memberIds.length < maxPartySize && !isAlreadyInParty) {
          state.party.memberIds.push(characterId);
          // Можно также убрать из резерва, если нужно
        }
      }),
    removeMember: (characterId) =>
      set((state) => {
        state.party.memberIds = state.party.memberIds.filter((id) => id !== characterId);
      }),
    moveToCell: (targetCellId) =>
      set((state) => {
        state.party.previousPartyPosition = state.party.currentPartyPosition;
        state.party.currentPartyPosition = targetCellId;
      }),
    setTravelMode: (mode) =>
      set((state) => {
        state.party.travelMode = mode;
      }),
    changeStamina: (delta: number) => {
      const allMemberIds = partySelectors.selectAllMemberIds(get());
      for (const memberId of allMemberIds) {
        get().characters.actions.changeStamina(memberId, delta);
      }
    },
    addCaptive: (captive) =>
      set((state) => {
        const maxCaptives = partySelectors.selectMaxCaptives(state);
        if (state.party.captives.length < maxCaptives) {
          state.party.captives.push(captive);
        }
      }),
    removeCaptive: (captiveId) =>
      set((state) => {
        state.party.captives = state.party.captives.filter((c) => c.id !== captiveId);
      }),
  },
});
