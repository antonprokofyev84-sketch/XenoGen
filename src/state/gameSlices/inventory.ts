import { PROTAGONIST_ID } from '@/constants';
import { RARITY_ORDER } from '@/types/common.types';
import type { EquipmentSlot } from '@/types/equipment.types';
import type { InventoryContainer, InventoryItem, ItemTypeFilter } from '@/types/inventory.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

// --- FILTERING HELPER ---

export function filterItemsByType(items: InventoryItem[], filter: ItemTypeFilter): InventoryItem[] {
  if (filter === null) return items;
  return items.filter((item) => filter.includes(item.type));
}

// --- SLICE INTERFACE ---

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

    addItems: (containerId: string, items: InventoryItem[]) => boolean;
    removeItems: (containerId: string, items: InventoryItem[]) => boolean;

    modifyMoney: (containerId: string, delta: number) => boolean;

    transferAll: (fromContainerId: string, toContainerId: string) => void;

    selectItem: (
      containerId: string,
      item: InventoryItem,
      context: 'inventory' | EquipmentSlot,
    ) => void;
    unselectItem: () => void;
  };
}

// --- SELECTORS ---

export const inventorySelectors = {
  selectContainer:
    (containerId: string = PROTAGONIST_ID) =>
    (state: StoreState) =>
      state.inventory.containers[containerId],

  selectContainerItems: (containerId: string) => (state: StoreState) =>
    state.inventory.containers[containerId]?.items ?? [],

  selectContainerItemsByFilter:
    (containerId: string, filter: ItemTypeFilter) => (state: StoreState) => {
      const items = state.inventory.containers[containerId]?.items ?? [];
      return filterItemsByType(items, filter);
    },

  selectContainerMoney:
    (containerId: string = PROTAGONIST_ID) =>
    (state: StoreState) =>
      state.inventory.containers[containerId]?.money ?? 0,

  selectPlayerItems: (state: StoreState) => state.inventory.containers[PROTAGONIST_ID]?.items ?? [],

  selectPlayerItemsByFilter: (filter: ItemTypeFilter) => (state: StoreState) => {
    const items = state.inventory.containers[PROTAGONIST_ID]?.items ?? [];
    return filterItemsByType(items, filter);
  },

  selectPlayerMoney: (state: StoreState) => state.inventory.containers[PROTAGONIST_ID]?.money ?? 0,

  /** Суммарное количество предмета у протагониста по всем стопкам. */
  selectPlayerItemCount:
    (itemId: string) =>
    (state: StoreState): number =>
      (state.inventory.containers[PROTAGONIST_ID]?.items ?? []).reduce(
        (total, item) => (item.templateId === itemId ? total + item.quantity : total),
        0,
      ),
};

// --- DRAFT HELPERS (operate on immer draft) ---

function addItemDraft(container: InventoryContainer, item: InventoryItem): void {
  const existing = container.items.find(
    (i) => i.templateId === item.templateId && i.rarity === item.rarity,
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    container.items.push({ ...item });
  }
}

function removeItemDraft(container: InventoryContainer, item: InventoryItem): void {
  const index = container.items.findIndex(
    (i) => i.templateId === item.templateId && i.rarity === item.rarity,
  );
  if (index === -1) return;

  const existing = container.items[index];
  if (existing.quantity > item.quantity) {
    existing.quantity -= item.quantity;
  } else {
    container.items.splice(index, 1);
  }
}

// --- DRAFT HELPERS EXPOSED TO EXTERNAL SYSTEMS ---

/**
 * Операции над инвентарём для систем, работающих внутри чужой транзакции
 * (исполнитель effects, дневные тики). Вложенного `set` здесь нет.
 */
export const inventoryDraft = {
  addItem: (state: StoreState, containerId: string, item: InventoryItem): void => {
    const container = state.inventory.containers[containerId];
    if (!container) return;

    addItemDraft(container, item);
  },

  removeItem: (state: StoreState, containerId: string, item: InventoryItem): void => {
    const container = state.inventory.containers[containerId];
    if (!container) return;

    removeItemDraft(container, item);
  },

  /**
   * Списывает предмет по шаблону, обходя стопки от низшей редкости к высшей.
   *
   * Стопка определяется парой `templateId + rarity`, поэтому один предмет
   * законно лежит в нескольких стопках. Стоимость и эффекты редкость не
   * задают, а проверка доступности считает по всем стопкам — значит и списание
   * обязано идти по всем, иначе проверка и оплата разойдутся.
   *
   * Возвращает незакрытый остаток; `0` означает полное списание.
   */
  removeItemsByTemplate: (
    state: StoreState,
    containerId: string,
    templateId: string,
    count: number,
  ): number => {
    const container = state.inventory.containers[containerId];
    if (!container || count <= 0) return Math.max(0, count);

    const stacks = container.items
      .filter((item) => item.templateId === templateId)
      .sort(
        (left, right) => RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity),
      );

    let remaining = count;

    for (const stack of stacks) {
      if (remaining <= 0) break;

      const taken = Math.min(stack.quantity, remaining);
      stack.quantity -= taken;
      remaining -= taken;
    }

    container.items = container.items.filter((item) => item.quantity > 0);

    return remaining;
  },

  modifyMoney: (state: StoreState, containerId: string, delta: number): void => {
    const container = state.inventory.containers[containerId];
    if (!container) return;

    const newAmount = container.money + delta;
    if (newAmount < 0) return;

    container.money = newAmount;
  },
};

// --- SLICE IMPLEMENTATION ---

export const createInventorySlice: GameSlice<InventorySlice> = (set) => ({
  containers: {
    [PROTAGONIST_ID]: {
      items: [],
      money: 0,
    },
  },
  selectedItem: null,
  actions: {
    createContainer: (id, initialData) => {
      set((state) => {
        if (!state.inventory.containers[id]) {
          state.inventory.containers[id] = {
            items: [],
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
        addItemDraft(container, item);
        success = true;
      });
      return success;
    },

    removeItem: (containerId, item) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;
        removeItemDraft(container, item);
        success = true;
      });
      return success;
    },

    addItems: (containerId, items) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;
        for (const item of items) addItemDraft(container, item);
        success = true;
      });
      return success;
    },

    removeItems: (containerId, items) => {
      let success = false;
      set((state) => {
        const container = state.inventory.containers[containerId];
        if (!container) return;
        for (const item of items) removeItemDraft(container, item);
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

        for (const srcItem of source.items) {
          addItemDraft(target, srcItem);
        }

        source.items = [];
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
