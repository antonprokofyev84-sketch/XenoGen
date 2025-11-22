import type { EquipmentSlot } from '@/types/equipment.types';
import type { InventoryItem, InventoryStorage, Resources } from '@/types/inventory.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

export interface InventorySlice {
  items: InventoryStorage;
  selectedItem: {
    item: InventoryItem | null;
    context: 'inventory' | EquipmentSlot;
  } | null;
  resources: Resources;

  actions: {
    addItem: (item: InventoryItem) => boolean;
    removeItem: (item: InventoryItem) => boolean;

    selectItem: (item: InventoryItem, context: 'inventory' | EquipmentSlot) => void;
    unselectItem: () => void;

    modifyResource: (resource: keyof Resources, delta: number) => void;
  };
}

// --- СЕЛЕКТОРЫ ---
export const inventorySelectors = {
  selectMeleeWeapons: (state: StoreState) => state.inventory.items.meleeWeapon,
  selectRangeWeapons: (state: StoreState) => state.inventory.items.rangeWeapon,
  selectArmor: (state: StoreState) => state.inventory.items.armor,
  selectGadgets: (state: StoreState) => state.inventory.items.gadget,
  selectConsumables: (state: StoreState) => state.inventory.items.consumable,
  selectMisc: (state: StoreState) => state.inventory.items.misc,

  selectAllItems: (state: StoreState) => {
    const i = state.inventory.items;
    return [
      ...i.meleeWeapon,
      ...i.rangeWeapon,
      ...i.armor,
      ...i.gadget,
      ...i.consumable,
      ...i.misc,
    ];
  },
};

export const createInventorySlice: GameSlice<InventorySlice> = (set, get) => ({
  items: {
    meleeWeapon: [],
    rangeWeapon: [],
    armor: [],
    gadget: [],
    consumable: [],
    misc: [],
  },
  selectedItem: null,
  resources: {
    money: 0,
    scrap: 0,
    food: 0,
  },

  actions: {
    addItem: (item: InventoryItem): boolean => {
      let success = false;

      set((state) => {
        const { templateId, type, rarity, quantity } = item;
        const targetArray = state.inventory.items[type];

        if (!targetArray) {
          console.warn(`Inventory: unknown type '${type}' in item`);
          return;
        }

        const existing = targetArray.find(
          (existingItem) =>
            existingItem.templateId === templateId && existingItem.rarity === rarity,
        );

        if (existing) {
          existing.quantity += quantity;
        } else {
          targetArray.push({
            templateId,
            type,
            rarity,
            quantity,
          });
        }

        success = true;
      });

      return success;
    },

    removeItem: (item: InventoryItem): boolean => {
      let success = false;

      set((state) => {
        const { templateId, rarity, quantity: amount, type } = item;
        const targetArray = state.inventory.items[type];

        if (!targetArray) {
          console.warn(`Inventory: unknown type '${type}' in item`);
          return; // success остается false
        }

        const existingIndex = targetArray.findIndex(
          (existingItem) =>
            existingItem.templateId === templateId && existingItem.rarity === rarity,
        );

        const existing = targetArray[existingIndex];

        if (!existing) return;

        if (existing.quantity > amount) {
          existing.quantity -= amount;
        } else {
          targetArray.splice(existingIndex, 1);
        }

        success = true;
      });

      return success;
    },

    // --- РЕАЛИЗАЦИЯ НОВЫХ ЭКШЕНОВ ---
    selectItem: (item, context) => {
      set((state) => {
        state.inventory.selectedItem = { item, context };
      });
    },

    unselectItem: () => {
      set((state) => {
        state.inventory.selectedItem = null;
      });
    },

    modifyResource: (resource, delta) => {
      set((state) => {
        state.inventory.resources[resource] = Math.max(
          0,
          state.inventory.resources[resource] + delta,
        );
      });
    },
  },
});
