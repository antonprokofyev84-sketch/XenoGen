import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { calculateAttackResult } from '@/systems/combat/combatHelpers';
import type { InitiativeItem } from '@/systems/combat/initiativeHelpers';
import {
  getBaseTurnTime,
  initInitiativeBarItems,
  insertItemByTimeSortedTail,
  roundToTwoDecimals,
} from '@/systems/combat/initiativeHelpers';
import type { CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';

const DEFAULT_TURNS_PER_UNIT = 5;

export type CombatStore = {
  unitsById: Record<string, CombatUnit>;

  allyIds: string[];
  enemyIds: string[];
  initiativeQueue: InitiativeItem[];
  lastTimeByUnitId: Record<string, number>;
  actions: {
    initializeCombat: (initialUnits: CombatUnit[]) => void;
    endTurn: () => void;
    applyDelay: (unitId: string, delayPoints: number) => void;
    setActiveWeaponSlot: (unitId: string, slot: WeaponSlots) => void;
  };
};

export const useCombatStore = create<CombatStore>()(
  immer((set, get) => ({
    unitsById: {},
    allyIds: [],
    enemyIds: [],
    initiativeQueue: [],
    lastTimeByUnitId: {},
    actions: {
      initializeCombat: (initialUnits) => {
        set((state) => {
          state.unitsById = Object.fromEntries(initialUnits.map((unit) => [unit.instanceId, unit]));
          state.allyIds = initialUnits
            .filter((unit) => unit.faction === 'player')
            .map((unit) => unit.instanceId);
          state.enemyIds = initialUnits
            .filter((unit) => unit.faction !== 'player')
            .map((unit) => unit.instanceId);
          const { initiativeQueue, lastTimeByUnitId } = initInitiativeBarItems(
            initialUnits,
            DEFAULT_TURNS_PER_UNIT,
          );

          state.initiativeQueue = initiativeQueue;
          state.lastTimeByUnitId = lastTimeByUnitId;
        });
      },
      endTurn: () => {
        set((state) => {
          const head = state.initiativeQueue.shift()!;
          const initiative = state.unitsById[head.unitId].stats.initiative;
          const step = getBaseTurnTime(initiative);

          const lastTime = state.lastTimeByUnitId[head.unitId] ?? head.time;
          const nextTime = roundToTwoDecimals(lastTime + step);

          const newItem: InitiativeItem = { unitId: head.unitId, time: nextTime };
          state.initiativeQueue = insertItemByTimeSortedTail(state.initiativeQueue, newItem);
          state.lastTimeByUnitId[head.unitId] = nextTime;
        });
      },

      applyDelay: (unitId: string, delayPoints: number) => {
        set((state) => {
          const initiative = state.unitsById[unitId].stats.initiative;
          const deltaTime = roundToTwoDecimals((100 / initiative) * (delayPoints / initiative));

          // 1) сдвигаем все будущие ходы этого юнита
          // item.time + deltaTime уже округлены так что не нужно округлять еще раз
          state.initiativeQueue = state.initiativeQueue.map((item) =>
            item.unitId === unitId ? { ...item, time: item.time + deltaTime } : item,
          );

          // 2) обновляем lastTimeByUnitId
          const last = state.lastTimeByUnitId[unitId];
          if (last !== undefined) state.lastTimeByUnitId[unitId] = last + deltaTime;

          // 3) пересортировка очереди
          state.initiativeQueue.sort((a, b) => {
            return a.time - b.time;
          });
        });
      },
      setActiveWeaponSlot: (unitId, slot) => {
        set((state) => {
          const unit = state.unitsById[unitId];

          const hasWeaponInSlot = unit.equipment[slot];

          if (hasWeaponInSlot) {
            unit.activeWeaponSlot = slot;
          } else {
            console.warn(`[useCombatStore] Unit ${unitId} has no weapon in ${slot} slot.`);
          }
        });
      },
      hit: (attackerId, targetId) => {
        const attacker = get().unitsById[attackerId];
        const target = get().unitsById[targetId];

        const result = calculateAttackResult(attacker, target);

        if (hit) {
          // TODO: В будущем здесь будет вызов экшена dealDamage(targetId, finalDamage)
          console.log(
            `[useCombatStore] ${attackerId} dealt ${finalDamage} damage to ${targetId}. Critical: ${crit}`,
          );
          // Пока просто лог, но можно временно добавить уменьшение HP для теста:
          // set((state) => {
          //   const targetUnit = state.unitsById[targetId];
          //   if (targetUnit) {
          //     targetUnit.stats.hp -= finalDamage;
          //     if (targetUnit.stats.hp < 0) targetUnit.stats.hp = 0;
          //   }
          // });
        } else {
          console.log(`[useCombatStore] ${attackerId} missed ${targetId}.`);
        }

        // TODO: Возможно, здесь нужно будет вызвать endTurn() или применить задержку
        // get().actions.endTurn();
        // или
        // get().actions.applyDelay(attackerId, calculatedDelay);
      },
    },
  })),
);
