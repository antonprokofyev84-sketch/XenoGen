import { DEFAULT_ARMOR_ID, DEFAULT_MELEE_ID } from '@/constants';
import type { StoreState } from '@/state/useGameState';
import { equipmentFactory } from '@/systems/equipment/equipmentFactory';
// Импортируем новые типы характеристик
import type { MainStats, SecondaryStats, Skills, StatBlock } from '@/types/character.types';
import type { EquipmentSlot, EquipmentSlots, WeaponSlots } from '@/types/equipment.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { ItemType } from '@/types/inventory.types';

import type { GameSlice } from '../types';

const DEFAULT_ARMOR_ITEM: Readonly<InventoryItem> = Object.freeze({
  templateId: DEFAULT_ARMOR_ID,
  rarity: 'common',
  type: 'armor',
  quantity: 1,
});

const DEFAULT_MELEE_ITEM: Readonly<InventoryItem> = Object.freeze({
  templateId: DEFAULT_MELEE_ID,
  rarity: 'common',
  type: 'meleeWeapon',
  quantity: 1,
});

const isWeaponSlot = (slot: EquipmentSlot): slot is WeaponSlots =>
  slot === 'meleePrimary' ||
  slot === 'meleeSecondary' ||
  slot === 'rangePrimary' ||
  slot === 'rangeSecondary';

// Проверка совместимости предмета и слота
const isValidSlotForType = (slot: EquipmentSlot, type: ItemType): boolean => {
  if (type === 'meleeWeapon') return slot === 'meleePrimary' || slot === 'meleeSecondary';
  if (type === 'rangeWeapon') return slot === 'rangePrimary' || slot === 'rangeSecondary';
  if (type === 'armor') return slot === 'armor';
  if (type === 'gadget') return slot === 'gadget';
  return false;
};

/**
 * Хелпер для агрегации статов с экипировки.
 * Суммирует статы со всех надетых вещей, КРОМЕ оружия.
 */
const aggregateEquipmentStats = <T extends Record<string, number>>(
  equippedItems: Partial<EquipmentSlots>,
  categoryKey: keyof StatBlock,
): T => {
  const totalStats = {} as T;

  for (const [slotKey, item] of Object.entries(equippedItems)) {
    const slot = slotKey as EquipmentSlot;

    // 1. Пропускаем пустые слоты
    if (!item) continue;

    // 2. Пропускаем оружие (оно дает урон, а не пассивные статы, по текущей логике)
    if (isWeaponSlot(slot)) continue;

    // 3. Получаем данные предмета
    const preview = equipmentFactory.getArmorPreview(item.templateId, item.rarity);

    // 4. Если нет модов или нужной категории, идем дальше
    if (!preview?.mods || !preview.mods[categoryKey]) continue;

    const statsGroup = preview.mods[categoryKey];

    // 5. Суммируем
    for (const [key, value] of Object.entries(statsGroup)) {
      const statName = key as keyof T;
      const modifierValue = value as number;

      const currentValue = (totalStats[statName] as number) ?? 0;
      totalStats[statName] = (currentValue + modifierValue) as T[keyof T];
    }
  }

  return totalStats;
};

export interface EquipmentSlice {
  equipmentByCharacterId: Record<string, Partial<EquipmentSlots>>;

  actions: {
    /**
     * Экипирует предмет.
     * @param characterId ID персонажа
     * @param item Предмет (должен содержать templateId, rarity, type, quantity)
     * @param slot (Опционально) Конкретный слот. Если нет - выберется автоматически.
     * @param force (Опционально) Если true, игнорирует проверку наличия в инвентаре.
     * @returns true, если успешно экипировано.
     */
    equipItem: (
      characterId: string,
      item: InventoryItem,
      slot?: EquipmentSlot,
      force?: boolean,
    ) => boolean;

    /**
     * Снимает предмет из слота и кладет его в инвентарь.
     * @returns Снятый предмет или null.
     */
    unequipItem: (characterId: string, slot: EquipmentSlot) => InventoryItem | null;

    resetCharacterEquipment: (characterId: string) => void;
  };
}

export const equipmentSelectors = {
  selectEquipmentByCharacterId:
    (characterId: string) =>
    (state: StoreState): Partial<EquipmentSlots> => {
      const currentEquipment = state.equipment.equipmentByCharacterId[characterId] ?? {};
      const result = { ...currentEquipment };

      if (!result.armor) {
        result.armor = DEFAULT_ARMOR_ITEM;
      }
      if (!result.meleePrimary) {
        result.meleePrimary = DEFAULT_MELEE_ITEM;
      }
      return result;
    },

  // Селектор для Основных характеристик (STR, DEX...) с экипировки
  selectMainStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<MainStats> => {
      const equippedItems = equipmentSelectors.selectEquipmentByCharacterId(characterId)(state);
      return aggregateEquipmentStats<MainStats>(equippedItems, 'mainStats');
    },

  // Селектор для Навыков с экипировки
  selectSkillMods:
    (characterId: string) =>
    (state: StoreState): Partial<Skills> => {
      const equippedItems = equipmentSelectors.selectEquipmentByCharacterId(characterId)(state);
      return aggregateEquipmentStats<Skills>(equippedItems, 'skills');
    },

  // Селектор для Вторичных статов с экипировки
  selectSecondaryStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<SecondaryStats> => {
      const equippedItems = equipmentSelectors.selectEquipmentByCharacterId(characterId)(state);
      return aggregateEquipmentStats<SecondaryStats>(equippedItems, 'secondaryStats');
    },
};

export const createEquipmentSlice: GameSlice<EquipmentSlice> = (set, get) => ({
  equipmentByCharacterId: {},

  actions: {
    unequipItem: (characterId, slot) => {
      let removedItem: InventoryItem | null = null;

      // 1. Сначала получаем предмет (чтение)
      const state = get();
      const currentEq = state.equipment.equipmentByCharacterId[characterId];
      if (currentEq && currentEq[slot]) {
        removedItem = currentEq[slot];
      }

      if (removedItem) {
        // 3. Добавляем в инвентарь (через экшен инвентаря)
        // Мы создаем объект InventoryItem, quantity всегда 1 при снятии
        state.inventory.actions.addItem({
          ...removedItem,
          quantity: 1,
        });

        // 4. Очищаем слот (запись)
        set((draft) => {
          const charEq = draft.equipment.equipmentByCharacterId[characterId];
          if (charEq) {
            charEq[slot] = null;
          }
        });
      }

      return removedItem;
    },

    equipItem: (characterId, item, slot, force = false) => {
      const state = get();
      const { templateId, rarity, type } = item;

      // --- ШАГ 1: Валидация наличия (БЕЗ УДАЛЕНИЯ) ---
      if (!force) {
        const itemsArray = state.inventory.items[type];
        if (!itemsArray) {
          console.warn(`[Equipment] Inventory corrupted: bucket ${type} missing`);
          return false;
        }
        // Проверяем, есть ли предмет в наличии
        const existing = itemsArray.find(
          (existingItem) =>
            existingItem.templateId === templateId &&
            existingItem.rarity === rarity &&
            existingItem.quantity > 0,
        );

        if (!existing) {
          console.warn(`[Equipment] Cannot equip ${templateId}: item not found in inventory.`);
          return false;
        }
      }

      // --- ШАГ 2: Определение слота ---
      let targetSlot: EquipmentSlot | undefined = slot;

      if (!targetSlot) {
        // Авто-выбор слота
        const currentEq = state.equipment.equipmentByCharacterId[characterId] ?? {};

        if (type === 'meleeWeapon') {
          // Приоритет: Свободный Primary -> Замена Secondary
          if (!currentEq.meleePrimary) {
            targetSlot = 'meleePrimary';
          } else {
            targetSlot = 'meleeSecondary';
          }
        } else if (type === 'rangeWeapon') {
          if (!currentEq.rangePrimary) {
            targetSlot = 'rangePrimary';
          } else {
            targetSlot = 'rangeSecondary';
          }
        } else if (type === 'armor') {
          targetSlot = 'armor';
        } else if (type === 'gadget') {
          targetSlot = 'gadget';
        }
      }

      if (!targetSlot) {
        console.error(`[Equipment] Cannot find valid slot for item type: ${type}`);
        return false;
      }

      // --- ШАГ 3: Валидация совместимости типа и слота ---
      if (!isValidSlotForType(targetSlot, type)) {
        console.warn(`[Equipment] Invalid slot ${targetSlot} for item type ${type}`);
        return false;
      }

      // --- ШАГ 4: Снятие старого предмета (если есть) ---
      // Это безопасно, так как unequipItem сам вернет предмет в инвентарь
      const currentEq = state.equipment.equipmentByCharacterId[characterId];
      if (currentEq && currentEq[targetSlot]) {
        get().equipment.actions.unequipItem(characterId, targetSlot);
      }

      // --- ШАГ 5: Удаление из инвентаря (COMMIT) ---
      // Только теперь, когда мы уверены, что слот свободен и валиден, забираем предмет
      if (!force) {
        const removedSuccess = state.inventory.actions.removeItem({ ...item, quantity: 1 });
        if (!removedSuccess) {
          console.error(`[Equipment] Critical error: Item vanished during equip transaction.`);
          // Теоретически, можно попробовать "вернуть" снятый предмет (шаг 4) обратно в слот,
          // но это крайний случай.
          return false;
        }
      }

      // --- ШАГ 6: Экипировка ---
      set((draft) => {
        const charEq = draft.equipment.equipmentByCharacterId[characterId] ?? {};
        // В слот мы кладем только EquipmentItem (без quantity)
        charEq[targetSlot!] = { ...item, quantity: 1 }; // ! безопасно, т.к. targetSlot определен выше
        draft.equipment.equipmentByCharacterId[characterId] = charEq;
      });

      return true;
    },

    resetCharacterEquipment: (characterId) => {
      set((state) => {
        state.equipment.equipmentByCharacterId[characterId] = {
          meleePrimary: null,
          meleeSecondary: null,
          rangePrimary: null,
          rangeSecondary: null,
          armor: null,
          gadget: null,
        };
      });
    },
  },
});
