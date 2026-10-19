import type { CellTerrain } from './cellContent.types';
import type { RemainingDays } from './common.types';
import type { CellId, FactionId, PoiId, PoiTemplateId } from './ids.types';
import type { PoiSchedule } from './poiContent.types';
import type { RegionParameters } from './region.types';

/**
 * Runtime-узлы мира.
 *
 * Топология выводится из `parentId`, а не из отдельного дискриминатора:
 *
 * ```text
 * parentId === null → клетка фиксированной карты
 * parentId !== null → обычный POI
 * ```
 *
 * Правило остаётся корректным, пока клетки являются единственными корневыми
 * узлами мира. Для надёжного сужения union у `CellNode.parentId` тип строго
 * `null`, а у `NonCellPoiNode.parentId` — строго `string`.
 *
 * Имя `WorldNode` выбрано вместо `PoiNode`, потому что union включает клетки,
 * которые POI не являются, и потому что legacy-тип `PoiNode` ещё существует.
 */

export interface CellDetails {
  /** Вычисляется из `id`, а не хранится в авторских данных. */
  col: number;
  row: number;

  terrain: CellTerrain;

  /** Raw-значения `0..999`; могут быть дробными. */
  regionParameters: RegionParameters;

  visitedTimes: number;
  lastTimeVisited: number | null;
  explorationLevel: number;
  explorationDaysLeft: RemainingDays;
}

/** Нормализованные details POI: после инициализации обязательные поля всегда заданы. */
export interface PoiDetails {
  isDiscovered: boolean;
  explorationThreshold: number;
  lifetimeDaysLeft: RemainingDays;

  faction?: FactionId;

  visitedTimes: number;
  lastTimeVisited: number | null;

  /** Постоянная блокировка нового входа; отсутствие поля означает `false`. */
  isEntryDisabled?: true;

  /** Временная блокировка входа в днях; уменьшается в конце дня, удаляется при `0`. */
  entryDisabledDaysLeft?: number;
}

export interface CellNode {
  id: CellId;
  parentId: null;

  /** У клетки всегда совпадает с `id`; добавляется системой ради единого интерфейса. */
  rootCellId: CellId;

  /** Только непосредственные дети, а не все потомки. */
  childPoiIds: PoiId[];

  details: CellDetails;
}

export interface NonCellPoiNode {
  id: PoiId;

  /** Непосредственный родитель: клетка либо другой POI. Никогда не `null`. */
  parentId: CellId | PoiId;

  rootCellId: CellId;
  templateId: PoiTemplateId;

  /** Только непосредственные дети. */
  childPoiIds: PoiId[];

  details: PoiDetails;

  /** Копируется из template, поэтому может быть изменено в runtime без мутации template. */
  schedule?: PoiSchedule;

  /**
   * Runtime-пометка завершённости. Помеченный узел не предлагается для новых
   * взаимодействий и не выполняет `onDayPass`; физическое удаление выполняется
   * одним общим проходом в конце дня.
   */
  pendingRemoval?: true;
}

export type WorldNode = CellNode | NonCellPoiNode;

/** Индекс всех узлов мира по их ID. */
export type WorldNodesById = Record<string, WorldNode>;

export function isCellNode(node: WorldNode): node is CellNode {
  return node.parentId === null;
}

export function isNonCellNode(node: WorldNode): node is NonCellPoiNode {
  return node.parentId !== null;
}
