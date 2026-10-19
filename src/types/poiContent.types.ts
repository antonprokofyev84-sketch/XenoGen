import type { TimeOfDayId } from '@/constants';

import type { RemainingDays } from './common.types';
import type {
  ActionId,
  CellId,
  FactionId,
  InterceptorId,
  NpcId,
  PoiId,
  PoiTemplateId,
  SlotId,
} from './ids.types';
import type { ChangeRegionParameterEffect, RegionLevels } from './region.types';

/**
 * Контракт авторских POI.
 *
 * Данные разделены на две связанные структуры:
 *
 * ```text
 * INITIAL_POIS_BY_CELL → где расположен экземпляр, его id и начальное состояние
 * POI_TEMPLATES        → расписание, actions, interceptors, slots, региональные
 *                        правила и дневные эффекты
 * ```
 *
 * Нарратив, Frames и presentation хранятся отдельно от POI templates.
 */

// ============================================================
// Placement
// ============================================================

export interface InitialPoiDetails {
  /** Отсутствие однозначно означает `false`; явно записывается только `true`. */
  isDiscovered?: true;

  /** Отсутствие означает значение template, иначе `0`. */
  explorationThreshold?: number;

  /**
   * Отсутствие означает значение template, иначе `null` — постоянный POI.
   * В авторских данных допустимы только `null` либо положительное целое.
   */
  lifetimeDaysLeft?: RemainingDays;

  /** Отсутствие означает значение template, иначе POI не принадлежит фракции. */
  faction?: FactionId;

  /** Отсутствие означает `0`. */
  visitedTimes?: number;

  /** Отсутствие означает `null`. */
  lastTimeVisited?: number | null;

  /** Постоянная блокировка нового входа; отсутствие означает `false`. */
  isEntryDisabled?: true;

  /** Временная блокировка входа в днях; уменьшается в конце дня. */
  entryDisabledDaysLeft?: number;
}

export interface InitialPoi {
  /** ID конкретного экземпляра POI. */
  id: PoiId;

  /** Ключ definition в `POI_TEMPLATES`. */
  templateId: PoiTemplateId;

  /** ID непосредственного родителя: клетки либо другого POI. */
  parentId: CellId | PoiId;

  details: InitialPoiDetails;
}

/**
 * Initial POI, сгруппированные по корневой клетке.
 * Ключ группы однозначно задаёт `rootCellId`, поэтому в записи он не хранится.
 */
export type InitialPoisByCell = Partial<Record<CellId, readonly InitialPoi[]>>;

// ============================================================
// Schedule
// ============================================================

export type PoiScheduleState = 'open' | 'closed';

/** Если расписание задано, оно явно содержит все шесть time slots. */
export type PoiSchedule = Record<TimeOfDayId, PoiScheduleState>;

// ============================================================
// NPC slots
// ============================================================

export interface InitialNpcSlot {
  /** Локальный ID slot внутри POI. */
  id: SlotId;

  /** Роль NPC в этом slot; принадлежит slot, а не NPC. */
  role: string;

  /**
   * Immutable пул кандидатов для автоматического заполнения.
   * Пустой массив означает, что без персонального назначения slot не занимается.
   */
  candidateNpcIds: readonly NpcId[];

  /** Вероятность автоматического заполнения `0..1`; отсутствие означает `1`. */
  chance?: number;

  /** Действия NPC именно в этой роли и в этом месте. */
  actionIds?: ActionId[];

  /** Автоматические события входа именно в этот slot. */
  interceptorIds?: InterceptorId[];
}

/** Пустые группы не указываются. Приоритет размещения: work → freeTime → home. */
export interface InitialNpcSlots {
  work?: InitialNpcSlot[];
  freeTime?: InitialNpcSlot[];
  home?: InitialNpcSlot[];
}

/**
 * Персональные назначения игрока по паре `poiId + slotId`.
 *
 * Работают по принципу «либо назначенный NPC, либо никто»: назначение не
 * меняет `candidateNpcIds`, при подходящем расписании занимает slot без
 * `chance`, а при недоступности оставляет slot пустым без fallback.
 */
export type RuntimeSlotAssignments = Partial<Record<PoiId, Partial<Record<SlotId, NpcId>>>>;

// ============================================================
// Template
// ============================================================

/** Поля details, которые template может задать как начальные значения. */
export type PoiTemplateDetails = Partial<
  Pick<InitialPoiDetails, 'explorationThreshold' | 'lifetimeDaysLeft' | 'faction'>
>;

export interface PoiTemplateDefinition {
  details?: PoiTemplateDetails;

  /** Отсутствие означает, что POI открыт всегда. */
  schedule?: PoiSchedule;

  /** Общие возможности места. */
  actionIds?: ActionId[];

  /** Базовые автоматические события входа в этот POI. */
  interceptorIds?: InterceptorId[];

  npcSlots?: InitialNpcSlots;

  /** Целые уровни `0..9`, заменяющие уровень root cell для параметра. */
  regionLevelOverrides?: RegionLevels;

  /** Целые дельты уровня, прибавляемые к уровню root cell. */
  regionLevelModifiers?: RegionLevels;

  /** Дневные эффекты, работающие с raw-значениями root cell. */
  onDayPass?: ChangeRegionParameterEffect[];
}

export type PoiTemplateMap = Record<PoiTemplateId, PoiTemplateDefinition>;
