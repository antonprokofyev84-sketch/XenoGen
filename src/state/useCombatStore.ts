import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { AttackRollResult } from '@/systems/combat/combatHelpers';
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

const POSITION_SWAP_MAP = [1, 0, 3, 2] as const;

export type CombatStore = {
  unitsById: Record<string, CombatUnit>;

  allyIds: string[];
  enemyIds: string[];
  initiativeQueue: InitiativeItem[];
  lastTimeByUnitId: Record<string, number>;
  attackResultById: Record<string, AttackRollResult[]>;

  actions: {
    initializeCombat: (initialUnits: CombatUnit[]) => void;
    endTurn: () => void;
    applyDelay: (unitId: string, delayPoints: number) => void;
    setActiveWeaponSlot: (unitId: string, slot: WeaponSlots) => void;
    swapPosition: (unitId: string) => void;
    attack: (attackerId: string, targetId: string) => void;
  };
};

export const combatSelectors = {
  selectAllies: (state: CombatStore): CombatUnit[] =>
    state.allyIds.map((id) => state.unitsById[id]),

  selectEnemies: (state: CombatStore): CombatUnit[] =>
    state.enemyIds.map((id) => state.unitsById[id]),

  selectCurrentTurnItem: (state: CombatStore) =>
    state.initiativeQueue.length > 0 ? state.initiativeQueue[0] : null,

  selectCurrentActiveUnit: (state: CombatStore): CombatUnit | null => {
    const head = state.initiativeQueue.length > 0 ? state.initiativeQueue[0] : null;
    return head ? state.unitsById[head.unitId] : null;
  },
};

export const useCombatStore = create<CombatStore>()(
  immer((set, get) => ({
    unitsById: {},
    allyIds: [],
    enemyIds: [],
    initiativeQueue: [],
    lastTimeByUnitId: {},
    attackResultById: {},

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
          state.attackResultById = {};
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
      swapPosition: (unitId: string) => {
        // get().actions.endTurn();
        set((state) => {
          const unit = state.unitsById[unitId];
          if (!unit) return;

          const newPosition = POSITION_SWAP_MAP[unit.position];
          unit.position = newPosition;
        });
      },
      attack: (attackerId, targetId) => {
        const attacker = get().unitsById[attackerId];
        const target = get().unitsById[targetId];
        const result = calculateAttackResult(attacker, target);

        set((state) => {
          state.attackResultById[targetId] = result;
        });

        // TODO: Возможно, здесь нужно будет вызвать добавить результаты в лог
      },
      applyAttackResults: () => {},
    },
  })),
);
