import type { InitialCell, InitialCellDetails, InitialCellList } from '@/types/cellContent.types';
import type { CellId, PoiId } from '@/types/ids.types';
import type {
  InitialPoi,
  InitialPoiDetails,
  InitialPoisByCell,
  PoiTemplateDefinition,
  PoiTemplateMap,
} from '@/types/poiContent.types';
import type {
  CellDetails,
  CellNode,
  NonCellPoiNode,
  PoiDetails,
  WorldNodesById,
} from '@/types/worldNode.types';

import { parseCellId } from './cellId';

/**
 * Построение runtime-мира из авторских данных.
 *
 * Нормализация выполняется **один раз** здесь, поэтому дальше runtime-код не
 * обрабатывает отсутствующие значения: `cell.details.visitedTimes` всегда
 * число, а не `number | undefined`.
 */

export const DEFAULT_CELL_STATE: Pick<
  CellDetails,
  'visitedTimes' | 'lastTimeVisited' | 'explorationLevel' | 'explorationDaysLeft'
> = {
  visitedTimes: 0,
  lastTimeVisited: null,
  explorationLevel: 0,
  // Отсутствие у клетки означает «не разведана», в отличие от POI.
  explorationDaysLeft: 0,
};

export const DEFAULT_POI_DETAILS: Omit<PoiDetails, 'faction'> = {
  isDiscovered: false,
  explorationThreshold: 0,
  // Отсутствие у POI означает «постоянный», в отличие от клетки.
  lifetimeDaysLeft: null,
  visitedTimes: 0,
  lastTimeVisited: null,
};

/**
 * Порядок сборки важен: сначала runtime-дефолты, затем авторские значения,
 * и только потом координаты, которые всегда вычисляются из `id`.
 */
export function normalizeCellDetails(cellId: CellId, details: InitialCellDetails): CellDetails {
  const { col, row } = parseCellId(cellId);

  return {
    ...DEFAULT_CELL_STATE,
    ...details,
    col,
    row,
  };
}

export function createCellNode(initialCell: InitialCell): CellNode {
  return {
    id: initialCell.id,
    parentId: null,
    rootCellId: initialCell.id,
    childPoiIds: [],
    details: normalizeCellDetails(initialCell.id, initialCell.details),
  };
}

/**
 * Объединяет details template и placement.
 *
 * Template может задать начальные `faction`, `explorationThreshold` и
 * `lifetimeDaysLeft`; конкретная placement-запись их переопределяет.
 * `isDiscovered`, `visitedTimes` и `lastTimeVisited` принадлежат экземпляру.
 */
export function normalizePoiDetails(
  placementDetails: InitialPoiDetails,
  template: PoiTemplateDefinition | undefined,
): PoiDetails {
  const merged: InitialPoiDetails = {
    ...template?.details,
    ...placementDetails,
  };

  const details: PoiDetails = {
    ...DEFAULT_POI_DETAILS,
    isDiscovered: merged.isDiscovered ?? DEFAULT_POI_DETAILS.isDiscovered,
    explorationThreshold: merged.explorationThreshold ?? DEFAULT_POI_DETAILS.explorationThreshold,
    lifetimeDaysLeft: merged.lifetimeDaysLeft ?? DEFAULT_POI_DETAILS.lifetimeDaysLeft,
    visitedTimes: merged.visitedTimes ?? DEFAULT_POI_DETAILS.visitedTimes,
    lastTimeVisited: merged.lastTimeVisited ?? DEFAULT_POI_DETAILS.lastTimeVisited,
  };

  if (merged.faction !== undefined) {
    details.faction = merged.faction;
  }

  // Флаги блокировки входа хранятся только во «включённом» состоянии.
  if (merged.isEntryDisabled === true) {
    details.isEntryDisabled = true;
  }

  if (merged.entryDisabledDaysLeft !== undefined) {
    details.entryDisabledDaysLeft = merged.entryDisabledDaysLeft;
  }

  return details;
}

export function createPoiNode(
  initialPoi: InitialPoi,
  rootCellId: CellId,
  template: PoiTemplateDefinition | undefined,
): NonCellPoiNode {
  const node: NonCellPoiNode = {
    id: initialPoi.id,
    parentId: initialPoi.parentId,
    rootCellId,
    templateId: initialPoi.templateId,
    childPoiIds: [],
    details: normalizePoiDetails(initialPoi.details, template),
  };

  // Расписание копируется, чтобы runtime-изменения не мутировали template.
  if (template?.schedule) {
    node.schedule = { ...template.schedule };
  }

  return node;
}

/**
 * Двухпроходная инициализация мира.
 *
 * 1. Создать все клетки и все POI; `rootCellId` берётся из ключа группы.
 * 2. Добавить каждый POI в `childPoiIds` его непосредственного родителя.
 *
 * Порядок POI внутри массива не важен: связи строятся вторым проходом.
 * В `childPoiIds` попадают только непосредственные дети.
 */
export function createInitialWorld(
  cells: InitialCellList,
  poisByCell: InitialPoisByCell,
  templates: PoiTemplateMap,
): WorldNodesById {
  const nodesById: WorldNodesById = {};

  // Проход 1: создание узлов.
  for (const cell of cells) {
    nodesById[cell.id] = createCellNode(cell);
  }

  const createdPoiIds: PoiId[] = [];

  for (const [rootCellId, pois] of Object.entries(poisByCell)) {
    for (const initialPoi of pois ?? []) {
      nodesById[initialPoi.id] = createPoiNode(
        initialPoi,
        rootCellId,
        templates[initialPoi.templateId],
      );
      createdPoiIds.push(initialPoi.id);
    }
  }

  // Проход 2: связывание с непосредственными родителями.
  for (const poiId of createdPoiIds) {
    const node = nodesById[poiId];

    if (!node || node.parentId === null) {
      continue;
    }

    const parent = nodesById[node.parentId];

    if (!parent) {
      throw new Error(`POI "${poiId}" references a missing parent: "${node.parentId}"`);
    }

    parent.childPoiIds.push(poiId);
  }

  return nodesById;
}
