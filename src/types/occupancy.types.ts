import type { NpcId, PoiId, SlotId } from './ids.types';
import type { RuntimeSlotAssignments } from './poiContent.types';

/**
 * Runtime-размещение NPC.
 *
 * Модель состоит из трёх независимых слоёв:
 *
 * ```text
 * template.npcSlots.candidateNpcIds → immutable авторские кандидаты
 * assignments                     → персональные назначения игрока, переживают смену time slot
 * schedules + slotOccupants       → transient: состояние текущего time slot
 * ```
 */

/** Группа slots, в которой NPC может быть размещён. Приоритет: work → freeTime → home. */
export type NpcSlotGroup = 'work' | 'freeTime' | 'home';

/** Конкретный slot конкретного POI. */
export interface NpcPlacement {
  poiId: PoiId;
  slotId: SlotId;
}

/**
 * Состояние NPC в текущем time slot.
 *
 * ```text
 * work | freeTime | home → NPC допустим только для slots одноимённой группы
 * hidden                 → автор запретил размещение
 * unplaced               → рабочее время без подходящего открытого места работы
 * ```
 *
 * `unplaced` не откатывается в `freeTime` либо `home`.
 */
export type ResolvedNpcState = NpcSlotGroup | 'hidden' | 'unplaced';

export interface ResolvedNpcSchedule {
  state: ResolvedNpcState;

  /** Заполнено только при `state: 'work'`: зарезервированный рабочий slot. */
  workplace?: NpcPlacement;
}

export interface OccupancyState {
  /**
   * Персональные назначения игрока по паре `poiId + slotId`.
   *
   * Снимаются только явной командой либо удалением POI; сменой time slot и
   * пересчётом occupancy не затрагиваются.
   */
  assignments: RuntimeSlotAssignments;

  /** Глобальный resolved schedule текущего time slot. */
  schedulesByNpcId: Record<NpcId, ResolvedNpcSchedule>;

  /** Фактические occupants: во внутренней записи присутствуют только занятые slots. */
  slotOccupants: Record<PoiId, Partial<Record<SlotId, NpcId>>>;

  /** Обратный индекс фактического размещения: один NPC занимает не более одного slot. */
  npcPlacements: Partial<Record<NpcId, NpcPlacement>>;

  /**
   * POI, occupancy которых уже разрешена в текущем time slot.
   *
   * Отсутствие записи и разрешённый POI без occupants — разные состояния,
   * поэтому пустота `slotOccupants` признаком неразрешённости не является.
   */
  resolvedPoiIds: Record<PoiId, true>;
}
