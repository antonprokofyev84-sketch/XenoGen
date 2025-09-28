import type { StoreState } from '@/state/useGameState';
import type { MainStatKey } from '@/types/character.types';
import type { Rarity } from '@/types/character.types';
import type { Character } from '@/types/character.types';
import type { Captive, TravelMode } from '@/types/party.types';

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
  currentCellId: string;
  previousCellId: string | null;
  travelMode: TravelMode;
  morale: number;

  actions: {
    addMember: (characterId: string) => void;
    removeMember: (characterId: string) => void;
    moveToCell: (targetCellId: string) => void;
    setTravelMode: (mode: TravelMode) => void;
    addCaptive: (templateId: string, rarity: Rarity) => void;
    removeCaptive: (captiveId: string) => void;
  };
}

// --- Вспомогательные функции ---

const areCellsAdjacent = (cellId1: string, cellId2: string): boolean => {
  const [col1, row1] = cellId1.split('-').map(Number);
  const [col2, row2] = cellId2.split('-').map(Number);
  const dx = Math.abs(col1 - col2);
  const dy = Math.abs(row1 - row2);
  if (dx === 0 && dy === 0) return false;
  return dx <= 1 && dy <= 1;
};

// --- Селекторы ---

export const partySelectors = {
  /** Возвращает полные данные всех членов активного отряда */
  selectPartyMembers: (state: StoreState) => {
    return state.party.memberIds.map((id) =>
      characterSelectors.selectCharacterById(id)(state),
    ) as Character[];
  },

  /** Возвращает максимальный размер отряда, зависящий от Харизмы протагониста */
  selectMaxPartySize: (state: StoreState): number => {
    const partyLeaderId = state.party.leaderId;
    const partyLeader = characterSelectors.selectCharacterById(partyLeaderId)(state) as Character;

    return BASE_PARTY_SIZE + Math.floor(partyLeader.skills.charisma / CHARISMA_PER_PARTY_SLOT);
  },

  /** Возвращает максимальное количество пленников, зависящее от Силы отряда */
  selectMaxCaptives: (state: StoreState): number => {
    const partyMembers = partySelectors.selectPartyMembers(state);
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
      const partyMembers = state.party.memberIds.filter((id) => id !== partyLeaderId);

      const partyLeaderStat =
        characterSelectors.selectEffectiveMainStats(partyLeaderId)(state)[stat];

      let highestValue = partyLeaderStat;

      for (const memberId of partyMembers) {
        const effectiveStats = characterSelectors.selectEffectiveMainStats(memberId)(state);
        const statValue = effectiveStats[stat] - NON_LEADER_STAT_PENALTY; // Штраф для не-лидера
        if (statValue > highestValue) {
          highestValue = statValue;
        }
      }

      return highestValue;
    },
};

export const createPartySlice: GameSlice<PartySlice> = (set, get) => ({
  memberIds: ['protagonist'], // Начинаем только с протагониста
  leaderId: 'protagonist',
  reserveIds: [],
  captives: [],
  currentCellId: '3-1',
  previousCellId: null,
  travelMode: 'normal',
  morale: 75,
  actions: {
    addMember: (characterId) =>
      set((state) => {
        const maxPartySize = partySelectors.selectMaxPartySize(state);
        if (state.party.memberIds.length < maxPartySize) {
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
        if (areCellsAdjacent(state.party.currentCellId, targetCellId)) {
          state.party.previousCellId = state.party.currentCellId;
          state.party.currentCellId = targetCellId;
        } else {
          console.warn(
            `Cannot move from ${state.party.currentCellId} to ${targetCellId}: not adjacent.`,
          );
        }
      }),
    setTravelMode: (mode) =>
      set((state) => {
        state.party.travelMode = mode;
      }),
    addCaptive: (templateId, rarity) =>
      set((state) => {
        const maxCaptives = partySelectors.selectMaxCaptives(state);
        if (state.party.captives.length < maxCaptives) {
          const newCaptive: Captive = {
            id: `captive_${Date.now()}`,
            templateId,
            rarity,
          };
          state.party.captives.push(newCaptive);
        }
      }),
    removeCaptive: (captiveId) =>
      set((state) => {
        state.party.captives = state.party.captives.filter((c) => c.id !== captiveId);
      }),
  },
});
