import type { RemainingDays } from '@/types/common.types';
import type { PoiId } from '@/types/ids.types';
import type { WorldNodesById } from '@/types/worldNode.types';

/**
 * Обход дерева мира и общие операции над узлами.
 *
 * Дерево строится только на `childPoiIds`: отдельных списков вложенных POI и
 * локальных точек больше нет.
 */

/**
 * Общий декремент мирового счётчика оставшихся дней.
 *
 * ```text
 * null → не изменяется: состояние постоянно
 * 0    → остаётся 0
 * N>0  → уменьшается на 1
 * ```
 */
export function decreaseRemainingDays(days: RemainingDays): RemainingDays {
  if (days === null) {
    return null;
  }

  return Math.max(0, days - 1);
}

/** Непосредственные дети узла. */
export function getChildPoiIds(nodesById: WorldNodesById, nodeId: string): readonly PoiId[] {
  return nodesById[nodeId]?.childPoiIds ?? [];
}

/** Все потомки узла в порядке обхода в глубину, не включая сам узел. */
export function collectDescendantPoiIds(nodesById: WorldNodesById, nodeId: string): PoiId[] {
  const descendants: PoiId[] = [];
  const queue = [...getChildPoiIds(nodesById, nodeId)];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === undefined) {
      continue;
    }
    descendants.push(currentId);
    queue.push(...getChildPoiIds(nodesById, currentId));
  }
  return descendants;
}
/**
 * Рекурсивно помечает POI и всех его потомков на удаление.
 *
 * Пометка потомков обязательна именно на логическом этапе: иначе непомеченный
 * потомок успел бы выполнить собственный `onDayPass` до физического удаления.
 * Операция идемпотентна.
 */
export function markPoiForRemoval(nodesById: WorldNodesById, poiId: PoiId): void {
  const node = nodesById[poiId];
  if (!node || node.parentId === null) {
    return;
  }
  node.pendingRemoval = true;

  for (const childId of node.childPoiIds) {
    markPoiForRemoval(nodesById, childId);
  }
}

/** Путь от узла до его корневой клетки, не включая сам узел. */
export function collectAncestorIds(nodesById: WorldNodesById, nodeId: string): string[] {
  const ancestors: string[] = [];
  let current = nodesById[nodeId];

  while (current && current.parentId !== null) {
    ancestors.push(current.parentId);
    current = nodesById[current.parentId];
  }
  return ancestors;
}
