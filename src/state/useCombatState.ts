import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { AttackForecast, AttackRollResult } from '@/systems/combat/combatHelpers';
import {
  calculateAttackForecast,
  calculateAttackResult,
  chooseTargetForecast,
} from '@/systems/combat/combatHelpers';
import type { InitiativeItem } from '@/systems/combat/combatInitiativeHelpers';
import {
  getBaseTurnTime,
  initInitiativeBarItems,
  insertItemByTimeSortedTail,
  roundToTwoDecimals,
} from '@/systems/combat/combatInitiativeHelpers';
import {
  addDefenseMetrics,
  addOffenseMetrics,
  blankMetric,
} from '@/systems/combat/combatMetricHelpers';
import type { CombatResult, CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';

const POSITION_SWAP_MAP = [1, 0, 3, 2] as const;

export type CombatStore = {
  unitsById: Record<string, CombatUnit>;
  combatResult: CombatResult;
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
    attack: (forecast: AttackForecast) => void;
    applyAttackResults: () => void;
    processAITurn: () => void;
  };
};

export const combatSelectors = {
  selectAliveAllies: (state: CombatStore): CombatUnit[] =>
    state.allyIds.map((id) => state.unitsById[id]).filter((unit) => unit.status === 'alive'),

  selectAliveEnemies: (state: CombatStore): CombatUnit[] =>
    state.enemyIds.map((id) => state.unitsById[id]).filter((unit) => unit.status === 'alive'),

  selectCurrentTurnItem: (state: CombatStore) =>
    state.initiativeQueue.length > 0 ? state.initiativeQueue[0] : null,

  selectCurrentActiveUnit: (state: CombatStore): CombatUnit | null => {
    const head = state.initiativeQueue.length > 0 ? state.initiativeQueue[0] : null;
    return head ? state.unitsById[head.unitId] : null;
  },

  selectIsUnitActive:
    (unitId: string) =>
    (state: CombatStore): boolean =>
      state.initiativeQueue.length > 0 && state.initiativeQueue[0].unitId === unitId,

  selectLinesOccupancyForUnits: (state: CombatStore): [number, number, number, number] => {
    const counts = [0, 0, 0, 0] as [number, number, number, number];

    for (const unit of Object.values(state.unitsById)) {
      if (unit.status !== 'alive') continue;
      const pos = unit.position;
      counts[pos] += 1;
    }

    return counts;
  },
};

export const useCombatState = create<CombatStore>()(
  immer((set, get) => ({
    unitsById: {},
    combatResult: { combatStatus: 'ongoing' } as CombatResult,
    allyIds: [],
    enemyIds: [],
    initiativeQueue: [],
    lastTimeByUnitId: {},
    attackResultById: {},

    actions: {
      initializeCombat: (initialUnits) => {
        set((state) => {
          state.unitsById = Object.fromEntries(initialUnits.map((unit) => [unit.instanceId, unit]));
          const allyIds = initialUnits
            .filter((unit) => unit.faction === 'player')
            .map((unit) => unit.instanceId);
          state.allyIds = allyIds;
          state.enemyIds = initialUnits
            .filter((unit) => unit.faction !== 'player')
            .map((unit) => unit.instanceId);
          const { initiativeQueue, lastTimeByUnitId } = initInitiativeBarItems(initialUnits);

          state.initiativeQueue = initiativeQueue;
          state.lastTimeByUnitId = lastTimeByUnitId;
          state.attackResultById = {};
          state.combatResult = {
            combatStatus: 'ongoing',
            loot: [],
            capturedEnemies: [],
            characterMetrics: Object.fromEntries(allyIds.map((id) => [id, blankMetric()])),
          };
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

          state.initiativeQueue = state.initiativeQueue.map((item, index) =>
            item.unitId === unitId && index !== 0 ? { ...item, time: item.time + deltaTime } : item,
          );

          const last = state.lastTimeByUnitId[unitId];
          if (last !== undefined) state.lastTimeByUnitId[unitId] = last + deltaTime;

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
            console.warn(`[useCombatState] Unit ${unitId} has no weapon in ${slot} slot.`);
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
      attack: (forcast) => {
        const result = calculateAttackResult(forcast);

        set((state) => {
          state.attackResultById[forcast.targetId] = result;
        });

        get().actions.applyDelay(forcast.attackerId, forcast.delayPoints);

        setTimeout(() => {
          get().actions.applyAttackResults();
        }, 500);
      },
      applyAttackResults: () => {
        let anyUnitDied = false;

        set((state) => {
          const resultsByTargetId = state.attackResultById;

          for (const [targetId, resultsArray] of Object.entries(resultsByTargetId)) {
            if (!resultsArray || resultsArray.length === 0) continue;

            const targetUnit = state.unitsById[targetId];
            if (!targetUnit || targetUnit.status === 'dead') continue;

            const attackerId = resultsArray[0].attackerId;
            const attackerMetrics = state.combatResult.characterMetrics[attackerId];
            if (attackerMetrics) {
              addOffenseMetrics(attackerMetrics, resultsArray);
            }

            const totalDamage = resultsArray.reduce((sum, r) => sum + r.damage, 0);
            const targetMetrics = state.combatResult.characterMetrics[targetId];

            if (targetMetrics) {
              addDefenseMetrics(targetMetrics, resultsArray);
            }

            if (totalDamage > 0) {
              targetUnit.stats.hp -= totalDamage;
              console.log(
                `[Combat] ${targetId} takes ${totalDamage} damage, ${targetUnit.stats.hp} HP left.`,
              );
            }

            if (targetUnit.stats.hp <= 0) {
              targetUnit.stats.hp = 0;
              targetUnit.status = 'dead';
              anyUnitDied = true;
              console.log(`[Combat] ${targetId} is DEAD.`);

              if (attackerMetrics) {
                attackerMetrics.kills += 1;
              }
            }
          }

          state.attackResultById = {};

          if (anyUnitDied) {
            state.initiativeQueue = state.initiativeQueue.filter(
              (item) => state.unitsById[item.unitId].status === 'alive',
            );
          }
        });

        if (anyUnitDied) {
          const aliveAllies = combatSelectors.selectAliveAllies(get());
          const aliveEnemies = combatSelectors.selectAliveEnemies(get());

          if (aliveAllies.length === 0) {
            set((state) => {
              state.combatResult.combatStatus = 'defeat';
            });
            return;
          } else if (aliveEnemies.length === 0) {
            set((state) => {
              state.combatResult.combatStatus = 'victory';
            });
            return;
          }
        }

        setTimeout(() => {
          get().actions.endTurn();
        }, 1000);
      },
      processAITurn: () => {
        const state = get();
        const currentActiveUnit = combatSelectors.selectCurrentActiveUnit(state);
        if (!currentActiveUnit || currentActiveUnit.faction === 'player') return;

        const allies = combatSelectors.selectAliveAllies(state);

        const occupiedPositions = combatSelectors.selectLinesOccupancyForUnits(state);

        if (
          currentActiveUnit.position === 3 &&
          currentActiveUnit.activeWeaponSlot === 'meleeWeapon'
        ) {
          get().actions.swapPosition(currentActiveUnit.instanceId);
          return;
        }

        if (
          currentActiveUnit.position === 2 ||
          (currentActiveUnit.position === 3 &&
            currentActiveUnit.activeWeaponSlot === 'rangeWeapon' &&
            currentActiveUnit.equipment.rangeWeapon!.distance === 3)
        ) {
          const forecasts_stay = allies
            .map((ally) => calculateAttackForecast(currentActiveUnit, ally, occupiedPositions))
            .filter(Boolean) as AttackForecast[];
          const targetForecast = chooseTargetForecast(forecasts_stay);
          console.log(targetForecast);
          if (targetForecast) {
            get().actions.attack(targetForecast);
            return;
          }
        }

        // this block handles unit position3 and range weapon with distance less than 3
        const simulatedUnit = structuredClone(currentActiveUnit);
        simulatedUnit.position = 2;

        const forecasts_move = allies
          .map((ally) => {
            return calculateAttackForecast(simulatedUnit, ally, occupiedPositions);
          })
          .filter(Boolean) as AttackForecast[];
        const targetForecast = chooseTargetForecast(forecasts_move);
        if (targetForecast) {
          const realForecast = calculateAttackForecast(
            currentActiveUnit,
            state.unitsById[targetForecast.targetId],
            occupiedPositions,
          )!;
          if (realForecast.canKill || realForecast.delayPoints === 0) {
            get().actions.attack(realForecast);
          } else {
            get().actions.swapPosition(currentActiveUnit.instanceId);
          }
        } else {
          get().actions.swapPosition(currentActiveUnit.instanceId);
        }
      },
    },
  })),
);
