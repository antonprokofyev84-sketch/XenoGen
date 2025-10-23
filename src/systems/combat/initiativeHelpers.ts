import type { CombatUnit } from '@/types/combat.types';

export type InitiativeItem = {
  unitId: string;
  time: number;
};

export type LastTimeByUnitId = Record<string, number>;

export function getBaseTurnTime(initiative: number): number {
  return 100 / initiative;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildTimesForUnit(unit: CombatUnit, itemsPerUnit: number): InitiativeItem[] {
  if (unit.status !== 'alive' || unit.stats.initiative <= 0) return [];

  const step = getBaseTurnTime(unit.stats.initiative);
  const items: InitiativeItem[] = [];

  for (let i = 0; i < itemsPerUnit; i++) {
    const time = roundToTwoDecimals(step * i); // стартуем с 0, шаг кратный step
    items.push({ unitId: unit.instanceId, time });
  }

  return items;
}

export function initInitiativeBarItems(
  units: CombatUnit[],
  turnsPerUnit: number,
): { initiativeQueue: InitiativeItem[]; lastTimeByUnitId: LastTimeByUnitId } {
  const initiativeByUnitId: Record<string, number> = {};
  for (const unit of units) {
    initiativeByUnitId[unit.instanceId] = unit.stats.initiative;
  }

  const initiativeQueue: InitiativeItem[] = [];
  const lastTimeByUnitId: LastTimeByUnitId = {};

  for (const unit of units) {
    const times = buildTimesForUnit(unit, turnsPerUnit);
    if (times.length > 0) {
      initiativeQueue.push(...times);
      lastTimeByUnitId[unit.instanceId] = times[times.length - 1].time;
    }
  }

  initiativeQueue.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    const initiativeA = initiativeByUnitId[a.unitId] ?? 0;
    const initiativeB = initiativeByUnitId[b.unitId] ?? 0;
    if (initiativeA !== initiativeB) return initiativeB - initiativeA; // выше инициатива — раньше
    return a.unitId < b.unitId ? -1 : 1;
  });

  return { initiativeQueue, lastTimeByUnitId };
}

export function insertItemByTimeSortedTail(
  items: InitiativeItem[],
  newItem: InitiativeItem,
): InitiativeItem[] {
  const result = [...items];

  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i].time <= newItem.time) {
      result.splice(i + 1, 0, newItem);
      return result;
    }
  }
  result.unshift(newItem);
  return result;
}
