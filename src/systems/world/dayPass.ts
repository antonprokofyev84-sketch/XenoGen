import type { Rng } from '@/systems/rolls/rng';
import { defaultRng, rollChance } from '@/systems/rolls/rng';
import type { PoiTemplateMap } from '@/types/poiContent.types';
import type { ChangeRegionParameterEffect } from '@/types/region.types';
import { REGION_RAW_MAX, REGION_RAW_MIN } from '@/types/region.types';
import type { CellNode, WorldNodesById } from '@/types/worldNode.types';
import { isCellNode, isNonCellNode } from '@/types/worldNode.types';

import { decreaseRemainingDays, markPoiForRemoval } from './worldTree';

/**
 * Дневной тик мира: эффекты POI, сроки жизни и мировые счётчики дней.
 *
 * Физическое удаление здесь не выполняется: истёкшие POI только помечаются,
 * а общий проход удаления идёт в самом конце дня, после квестовых таймеров.
 */

/**
 * Применяет один `changeRegionParameter` к raw-значению root cell.
 *
 * `min`/`max` являются границами влияния **этого эффекта**: они насыщают
 * изменение на границе, но не возвращают уже вышедшее за неё значение обратно.
 *
 * ```text
 * current 398, delta +5, max 400 → 400
 * current 500, delta +5, max 400 → 500
 * current 2, delta -5, min 0 → 0
 * current 100, delta -5, min 200 → 100
 * ```
 */
export function applyChangeRegionParameter(
  cell: CellNode,
  effect: ChangeRegionParameterEffect,
  rng: Rng = defaultRng,
): void {
  if (!rollChance(rng, effect.chance ?? 1)) {
    return;
  }

  const current = cell.details.regionParameters[effect.cellParam];
  const lowerBound = effect.min ?? REGION_RAW_MIN;
  const upperBound = effect.max ?? REGION_RAW_MAX;

  let next = current + effect.delta;

  if (next > upperBound) {
    next = Math.max(current, upperBound);
  }

  if (next < lowerBound) {
    next = Math.min(current, lowerBound);
  }

  cell.details.regionParameters[effect.cellParam] = Math.min(
    REGION_RAW_MAX,
    Math.max(REGION_RAW_MIN, next),
  );
}

/**
 * Прогоняет POI-часть одного дня.
 *
 * Порядок важен и зафиксирован контрактом:
 *
 * 1. Обойти POI, существовавшие **к началу** тика; помеченные пропустить.
 * 2. После `onDayPass` уменьшить непостоянные сроки жизни непомеченных POI.
 * 3. Достигший нуля POI немедленно рекурсивно пометить вместе с потомками.
 *
 * Поэтому временный POI с `lifetimeDaysLeft: 1` успевает отработать свой
 * последний день, а помеченное поддерево дальнейшие эффекты уже не выполняет.
 * POI, созданные во время текущего тика, в начальный список не попадают.
 */
export function runPoiDayPass(
  nodesById: WorldNodesById,
  templates: PoiTemplateMap,
  rng: Rng = defaultRng,
): void {
  const initialPoiIds = Object.values(nodesById)
    .filter(isNonCellNode)
    .map((node) => node.id);

  for (const poiId of initialPoiIds) {
    const poi = nodesById[poiId];

    // Повторная проверка: узел мог быть помечен эффектом этого же тика.
    if (!poi || !isNonCellNode(poi) || poi.pendingRemoval) {
      continue;
    }

    const onDayPass = templates[poi.templateId]?.onDayPass;
    if (!onDayPass) continue;

    const rootCell = nodesById[poi.rootCellId];
    if (!rootCell || !isCellNode(rootCell)) continue;

    for (const effect of onDayPass) {
      applyChangeRegionParameter(rootCell, effect, rng);
    }
  }

  for (const poiId of initialPoiIds) {
    const poi = nodesById[poiId];

    if (!poi || !isNonCellNode(poi) || poi.pendingRemoval) {
      continue;
    }

    if (poi.details.lifetimeDaysLeft === null) {
      continue;
    }

    poi.details.lifetimeDaysLeft = decreaseRemainingDays(poi.details.lifetimeDaysLeft);

    if (poi.details.lifetimeDaysLeft === 0) {
      markPoiForRemoval(nodesById, poiId);
    }
  }
}

/**
 * Уменьшает мировые счётчики оставшихся дней, не связанные со сроком жизни POI:
 * актуальность разведданных клеток и временную блокировку входа в POI.
 */
export function decreaseWorldDayCounters(nodesById: WorldNodesById): void {
  for (const node of Object.values(nodesById)) {
    if (isCellNode(node)) {
      node.details.explorationDaysLeft = decreaseRemainingDays(node.details.explorationDaysLeft);
      continue;
    }

    const { entryDisabledDaysLeft } = node.details;

    if (entryDisabledDaysLeft === undefined) {
      continue;
    }

    const next = Math.max(0, entryDisabledDaysLeft - 1);

    // Поле хранится только во «включённом» состоянии: на нуле блокировка снята.
    if (next === 0) {
      delete node.details.entryDisabledDaysLeft;
    } else {
      node.details.entryDisabledDaysLeft = next;
    }
  }
}
