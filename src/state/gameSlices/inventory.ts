import { PROTAGONIST_ID } from '@/constants';
import type { EquipmentSlot } from '@/types/equipment.types';
import type {
  InventoryContainer,
  InventoryItem,
  InventoryStorage,
  ItemType,
} from '@/types/inventory.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

// Хелпер для создания пустого хранилища
const createEmptyStorage = (): InventoryStorage => ({
  meleeWeapon: [],
  rangeWeapon: [],
  armor: [],
  gadget: [],
  resource: [],
  consumable: [],
  misc: [],
});

export interface InventorySlice {
  // Ключ в Record — это и есть ID контейнера
  containers: Record<string, InventoryContainer>;

  selectedItem: {
    containerId: string;
    item: InventoryItem | null;
    context: 'inventory' | EquipmentSlot;
  } | null;

  actions: {
    createContainer: (id: string, initialData?: Partial<InventoryContainer>) => void;
    removeContainer: (id: string) => void;

    addItem: (containerId: string, item: InventoryItem) => boolean;
    removeItem: (containerId: string, item: InventoryItem) => boolean;

    modifyMoney: (containerId: string, delta: number) => boolean;

    // Вместо addLoot — перенос всего содержимого (например, лут с трупа)
    transferAll: (fromContainerId: string, toContainerId: string) => void;

    selectItem: (
      containerId: string,
      item: InventoryItem,
      context: 'inventory' | EquipmentSlot,
    ) => void;
    unselectItem: () => void;
  };
}

// --- СЕЛЕКТОРЫ ---

export const inventorySelectors = {
  selectContainer:
    (containerId: string = PROTAGONIST_ID) =>
    (state: StoreState) =>
      state.inventory.containers[containerId],

  selectContainerItemsByType: (containerId: string, type: ItemType) => (state: StoreState) => {
    const container = state.inventory.containers[containerId];
    return container ? container.items[type] : [];
  },

  selectContainerMoney:
    (containerId: string = PROTAGONIST_ID) =>
    (state: StoreState) =>
      state.inventory.containers[containerId]?.money ?? 0,

  // Хелперы для игрока
  selectPlayerItemsByType: (type: ItemType) => (state: StoreState) =>
    state.inventory.containers[PROTAGONIST_ID]?.items[type] ?? [],

  selectPlayerMoney: (state: StoreState) => state.inventory.containers[PROTAGONIST_ID]?.money ?? 0,
};

export const createInventorySlice: GameSlice<InventorySlice> = (set, get) => ({
  containers: {
    [PROTAGONIST_ID]: {
      items: createEmptyStorage(),
      money: 0,
    },
  },
  selectedItem: null,

  actions: {
    createContainer: (id, initialData) => {
      set((state) => {
        if (!state.inventory.containers[id]) {
          state.inventory.containers[id] = {
            items: createEmptyStorage(),
            money: 0,
            ...initialData,
          };
        }
      });
    },

    removeContainer: (id) => {
      set((state) => {
        delete state.inventory.containers[id];
      });
    },

    addItem: (containerId, item) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;

        const targetArray = container.items[item.type];

        const existing = targetArray.find(
          (i) => i.templateId === item.templateId && i.rarity === item.rarity,
        );

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          targetArray.push({ ...item });
        }
        success = true;
      });
      return success;
    },

    removeItem: (containerId, item) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;

        const targetArray = container.items[item.type];
        const index = targetArray.findIndex(
          (i) => i.templateId === item.templateId && i.rarity === item.rarity,
        );

        if (index === -1) return;

        const existing = targetArray[index];
        if (existing.quantity > item.quantity) {
          existing.quantity -= item.quantity;
        } else {
          targetArray.splice(index, 1);
        }
        success = true;
      });
      return success;
    },

    modifyMoney: (containerId, delta) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;

        const newAmount = container.money + delta;
        if (newAmount < 0) return;

        container.money = newAmount;
        success = true;
      });
      return success;
    },

    transferAll: (fromId, toId) => {
      set((state) => {
        const source = state.inventory.containers[fromId];
        const target = state.inventory.containers[toId];

        if (!source || !target) return;

        // 1. Переносим деньги
        target.money += source.money;
        source.money = 0;

        // 2. Переносим предметы всех категорий
        const categories = Object.keys(source.items) as ItemType[];

        categories.forEach((type) => {
          const sourceItems = source.items[type];
          const targetItems = target.items[type];

          sourceItems.forEach((srcItem) => {
            const existing = targetItems.find(
              (t) => t.templateId === srcItem.templateId && t.rarity === srcItem.rarity,
            );

            if (existing) {
              existing.quantity += srcItem.quantity;
            } else {
              targetItems.push({ ...srcItem });
            }
          });

          // Очищаем источник
          source.items[type] = [];
        });
      });
    },

    selectItem: (containerId, item, context) => {
      set((state) => {
        state.inventory.selectedItem = { containerId, item, context };
      });
    },

    unselectItem: () => {
      set((state) => {
        state.inventory.selectedItem = null;
      });
    },
  },
});
