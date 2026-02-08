import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { useGameState } from '@/state/useGameState';
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
import { generateLoot } from '@/systems/combat/combatLootGenerator';
import {
  addDefenseMetrics,
  addOffenseMetrics,
  blankMetric,
} from '@/systems/combat/combatMetricHelpers';
import type { CharacterUpdates, CombatResult, CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';
import type { CombatLoot } from '@/types/inventory.types';

const POSITION_SWAP_MAP = [1, 0, 3, 2] as const;

export type CombatStore = {
  unitsById: Record<string, CombatUnit>;
  allyIds: string[];
  enemyIds: string[];
  initiativeQueue: InitiativeItem[];
  lastTimeByUnitId: Record<string, number>;
  attackResultById: Record<string, AttackRollResult[]>;
  combatResult: CombatResult;
  characterUpdates: CharacterUpdates;
  loot: CombatLoot | null;
  isActionLocked: boolean;

  actions: {
    initializeCombat: (initialUnits: CombatUnit[]) => void;
    endTurn: () => void;
    applyDelay: (unitId: string, delayPoints: number) => void;
    setActiveWeaponSlot: (unitId: string, slot: WeaponSlots) => void;
    swapPosition: (unitId: string) => void;
    attack: (forecast: AttackForecast) => void;
    applyAttackResults: () => void;
    processAITurn: () => void;
    finishBattle: () => void; // <-- 2. ДОБАВЛЕН НОВЫЙ ЭКШЕН
    setCharacterUpdates: (updates: CharacterUpdates) => void;
    _lockAction: () => boolean;
    _unlockAction: () => void;
  };
};

export const combatSelectors = {
  selectAliveAllies: (state: CombatStore): CombatUnit[] =>
    state.allyIds.map((id) => state.unitsById[id]).filter((unit) => unit.status === 'alive'),

  selectAliveEnemies: (state: CombatStore): CombatUnit[] =>
    state.enemyIds.map((id) => state.unitsById[id]).filter((unit) => unit.status === 'alive'),

  selectUnconsciousEnemies: (state: CombatStore): CombatUnit[] =>
    state.enemyIds.map((id) => state.unitsById[id]).filter((unit) => unit.status === 'unconscious'),

  selectAllEnemies: (state: CombatStore): CombatUnit[] =>
    state.enemyIds.map((id) => state.unitsById[id]),

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

    allyIds: [],
    enemyIds: [],
    initiativeQueue: [],
    lastTimeByUnitId: {},
    attackResultById: {},
    combatResult: { combatStatus: 'ongoing' } as CombatResult,
    characterUpdates: null,
    loot: null,
    isActionLocked: false,

    actions: {
      initializeCombat: (initialUnits) => {
        set((state) => {
          state.unitsById = Object.fromEntries(initialUnits.map((unit) => [unit.id, unit]));
          const allyIds = initialUnits
            .filter((unit) => unit.faction === 'player')
            .map((unit) => unit.id);
          state.allyIds = allyIds;
          state.enemyIds = initialUnits
            .filter((unit) => unit.faction !== 'player')
            .map((unit) => unit.id);
          const { initiativeQueue, lastTimeByUnitId } = initInitiativeBarItems(initialUnits);

          state.initiativeQueue = initiativeQueue;
          state.lastTimeByUnitId = lastTimeByUnitId;
          state.attackResultById = {};
          state.combatResult = {
            combatStatus: 'ongoing',
            characterMetrics: Object.fromEntries(allyIds.map((id) => [id, blankMetric()])),
          };
          state.characterUpdates = null;
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
        if (get().actions._lockAction()) return;
        set((state) => {
          const unit = state.unitsById[unitId];
          if (!unit) return;
          const newPosition = POSITION_SWAP_MAP[unit.position];
          unit.position = newPosition;
        });

        setTimeout(() => {
          get().actions._unlockAction();
          get().actions.endTurn();
        }, 1000);
      },
      attack: (forcast) => {
        if (get().actions._lockAction()) return;

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
            //metrics only exist for player characters
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
            }

            if (targetUnit.stats.hp <= 0) {
              targetUnit.stats.hp = 0;

              if (targetUnit.faction === 'player' || Math.random() > resultsArray[0].lethality) {
                targetUnit.status = 'unconscious';
              } else {
                targetUnit.status = 'dead';
              }

              anyUnitDied = true;

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
            get().actions.finishBattle();
            return;
          } else if (aliveEnemies.length === 0) {
            set((state) => {
              state.combatResult.combatStatus = 'victory';
            });
            get().actions.finishBattle();
            return;
          }
        }

        setTimeout(() => {
          get().actions._unlockAction();
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
          currentActiveUnit.activeWeaponSlot === 'meleePrimary' // for now enemies could have only Primary slots
        ) {
          get().actions.swapPosition(currentActiveUnit.id);
          return;
        }

        if (
          currentActiveUnit.position === 2 ||
          (currentActiveUnit.position === 3 &&
            currentActiveUnit.activeWeaponSlot === 'rangePrimary' &&
            currentActiveUnit.equipment.rangePrimary!.distance === 3)
        ) {
          const forecasts_stay = allies
            .map((ally) => calculateAttackForecast(currentActiveUnit, ally, occupiedPositions))
            .filter(Boolean) as AttackForecast[];
          const targetForecast = chooseTargetForecast(forecasts_stay);
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
            get().actions.swapPosition(currentActiveUnit.id);
          }
        } else {
          get().actions.swapPosition(currentActiveUnit.id);
        }
      },

      finishBattle: () => {
        const combatResult = get().combatResult;
        const logs = useGameState.getState().world.actions.endBattle(combatResult);

        const allEnemies = combatSelectors.selectAllEnemies(get());
        const loot = generateLoot(allEnemies);

        set((state) => {
          state.loot = loot;
          state.characterUpdates = logs;
        });
      },

      setCharacterUpdates: (updates) => {
        set((state) => {
          state.characterUpdates = updates;
        });
      },

      _lockAction: () => {
        if (get().isActionLocked) return true;
        set((state) => {
          state.isActionLocked = true;
        });
        return false;
      },
      _unlockAction: () => {
        set((state) => {
          state.isActionLocked = false;
        });
      },
    },
  })),
);
