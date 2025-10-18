import { mainStatKeys, secondaryStatsKeys, skillKeys } from '@/state/constants';
import type { StoreState } from '@/state/useGameState';
import { equipmentFactory } from '@/systems/equipment/equipmentFactory';
import type { Rarity } from '@/types/common.types';
import type { EquipmentItem, EquipmentSlot, EquipmentSlots } from '@/types/equipment.types';

import type { GameSlice } from '../types';

const WEAPON_SLOTS = new Set<EquipmentSlot>(['melee', 'ranged']);
const isWeaponSlot = (slot: EquipmentSlot) => WEAPON_SLOTS.has(slot);

const filterModsByKeys = (
  totalMods: Record<string, number>,
  validKeys: string[],
): Record<string, number> => {
  const filteredMods: Record<string, number> = {};
  for (const key of validKeys) {
    if (totalMods[key]) {
      filteredMods[key] = totalMods[key];
    }
  }
  return filteredMods;
};

export interface EquipmentSlice {
  /**
   * Stores equipped items for each character.
   * Key: characterId, Value: an object of equipment slots.
   */
  equipmentByCharacterId: Record<string, Partial<EquipmentSlots>>;

  actions: {
    equipItem: (
      characterId: string,
      slot: EquipmentSlot,
      templateId: string,
      rarity: Rarity,
    ) => EquipmentItem | null;
    unequipItem: (characterId: string, slot: EquipmentSlot) => EquipmentItem | null;
    resetCharacterEquipment: (characterId: string) => void;
  };
}

export const equipmentSelectors = {
  selectEquipmentByCharacterId:
    (characterId: string) =>
    (state: StoreState): Partial<EquipmentSlots> => {
      return state.equipment.equipmentByCharacterId[characterId] ?? {};
    },

  selectTotalModsByCharacterId:
    (characterId: string) =>
    (state: StoreState): Record<string, number> => {
      const equippedItems = equipmentSelectors.selectEquipmentByCharacterId(characterId)(state);
      const totalMods: Record<string, number> = {};

      for (const slot in equippedItems) {
        const equipmentSlot = slot as EquipmentSlot;
        const item = equippedItems[equipmentSlot];

        if (!item || isWeaponSlot(equipmentSlot)) {
          continue;
        }

        const preview = equipmentFactory.getArmorPreview(item.templateId, item.rarity);

        if (!preview?.mods) continue;

        for (const [key, value] of Object.entries(preview.mods)) {
          totalMods[key] = (totalMods[key] ?? 0) + value;
        }
      }

      return totalMods;
    },

  selectMainStatMods: (characterId: string) => (state: StoreState) => {
    const totalMods = equipmentSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, mainStatKeys);
  },

  selectSkillMods: (characterId: string) => (state: StoreState) => {
    const totalMods = equipmentSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, skillKeys);
  },

  selectSecondaryStatMods: (characterId: string) => (state: StoreState) => {
    const totalMods = equipmentSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, secondaryStatsKeys);
  },
};

export const createEquipmentSlice: GameSlice<EquipmentSlice> = (set) => ({
  equipmentByCharacterId: {},
  actions: {
    equipItem: (characterId, slot, templateId, rarity) => {
      let previouslyEquipped: EquipmentItem | null = null;
      set((state) => {
        const characterEquipment = state.equipment.equipmentByCharacterId[characterId] ?? {};
        previouslyEquipped = characterEquipment[slot] ?? null;
        characterEquipment[slot] = { templateId, rarity };
        state.equipment.equipmentByCharacterId[characterId] = characterEquipment;
      });
      return previouslyEquipped;
    },

    unequipItem: (characterId, slot) => {
      let removedItem: EquipmentItem | null = null;
      set((state) => {
        const characterEquipment = state.equipment.equipmentByCharacterId[characterId];
        if (characterEquipment && characterEquipment[slot]) {
          removedItem = characterEquipment[slot] as EquipmentItem;
          characterEquipment[slot] = null;
        }
      });
      return removedItem;
    },

    resetCharacterEquipment: (characterId) => {
      set((state) => {
        state.equipment.equipmentByCharacterId[characterId] = {};
      });
    },
  },
});
