import type { TimeOfDayId } from '@/constants';
import { isPoiOpenAt } from '@/systems/world/poiSchedule';
import type { NpcId, PoiId } from '@/types/ids.types';
import type { InitialNpcMap } from '@/types/npcContent.types';
import type { RuntimeNpcMap } from '@/types/npcRuntime.types';
import type { NpcPlacement, ResolvedNpcSchedule } from '@/types/occupancy.types';
import type {
  InitialNpcSlot,
  PoiTemplateMap,
  RuntimeSlotAssignments,
} from '@/types/poiContent.types';
import type { WorldNodesById } from '@/types/worldNode.types';
import { isNonCellNode } from '@/types/worldNode.types';

/**
 * Глобальный resolved schedule NPC.
 *
 * Расписание задаёт **время** работы, а work slots POI — её **место**. Ни
 * одного из источников по отдельности недостаточно, поэтому состояние `work`
 * базового расписания превращается в размещаемое только после того, как для
 * NPC найдено открытое рабочее место.
 *
 * Резолвер работает по всему миру и не зависит от того, посещён ли рабочий
 * POI: он лишь резервирует работающих NPC за конкретным work slot и тем самым
 * исключает их из групп `freeTime` и `home` где бы то ни было. Фактические
 * occupants выбираются лениво при входе игрока в POI.
 */

export interface NpcScheduleInput {
  /** Кто существует в мире. */
  npcsById: RuntimeNpcMap;

  /** Неизменные авторские данные, включая `baseSchedule`. */
  npcContent: InitialNpcMap;

  nodesById: WorldNodesById;
  templates: PoiTemplateMap;
  assignments: RuntimeSlotAssignments;
  timeOfDay: TimeOfDayId;
}

interface OpenWorkplace {
  poiId: PoiId;
  workSlots: readonly InitialNpcSlot[];
}

/**
 * POI, пригодные как место работы в этот time slot.
 *
 * Закрытый и помеченный на удаление POI рабочих NPC не удерживает;
 * `isDiscovered` на симуляцию не влияет — мир живёт независимо от того, что
 * игрок уже нашёл.
 */
function listOpenWorkplaces(input: NpcScheduleInput): OpenWorkplace[] {
  const workplaces: OpenWorkplace[] = [];

  for (const node of Object.values(input.nodesById)) {
    if (!isNonCellNode(node) || node.pendingRemoval) continue;
    if (!isPoiOpenAt(node, input.timeOfDay)) continue;

    const workSlots = input.templates[node.templateId]?.npcSlots?.work;
    if (!workSlots || workSlots.length === 0) continue;

    workplaces.push({ poiId: node.id, workSlots });
  }

  return workplaces;
}

/**
 * Резервирует рабочее место за NPC.
 *
 * Первая удачная резервация закрепляется: повторные кандидатуры того же NPC
 * игнорируются, поэтому порядок проходов и задаёт приоритет источников.
 */
function reserveWorkplace(
  reservations: Partial<Record<NpcId, NpcPlacement>>,
  input: NpcScheduleInput,
  npcId: NpcId,
  placement: NpcPlacement,
): void {
  if (reservations[npcId] !== undefined) return;
  if (!(npcId in input.npcsById)) return;
  if (input.npcContent[npcId]?.baseSchedule[input.timeOfDay] !== 'work') return;

  reservations[npcId] = placement;
}

/**
 * Сопоставляет работающих NPC с конкретными work slots.
 *
 * Назначения игрока имеют приоритет над авторским членством, поэтому
 * назначения разбираются первым проходом. Slot с назначением работает по
 * принципу «либо назначенный NPC, либо никто», и его авторские кандидаты во
 * втором проходе не рассматриваются.
 *
 * Несколько кандидатов одного slot резервируются одновременно: slot займёт
 * один из них, остальные останутся неразмещёнными.
 */
function collectWorkplaceReservations(
  input: NpcScheduleInput,
): Partial<Record<NpcId, NpcPlacement>> {
  const reservations: Partial<Record<NpcId, NpcPlacement>> = {};
  const openWorkplaces = listOpenWorkplaces(input);

  for (const { poiId, workSlots } of openWorkplaces) {
    for (const slot of workSlots) {
      const assignedNpcId = input.assignments[poiId]?.[slot.id];
      if (assignedNpcId === undefined) continue;

      reserveWorkplace(reservations, input, assignedNpcId, { poiId, slotId: slot.id });
    }
  }

  for (const { poiId, workSlots } of openWorkplaces) {
    for (const slot of workSlots) {
      if (input.assignments[poiId]?.[slot.id] !== undefined) continue;

      for (const candidateNpcId of slot.candidateNpcIds) {
        reserveWorkplace(reservations, input, candidateNpcId, { poiId, slotId: slot.id });
      }
    }
  }

  return reservations;
}

export function resolveNpcSchedules(input: NpcScheduleInput): Record<NpcId, ResolvedNpcSchedule> {
  const reservations = collectWorkplaceReservations(input);
  const schedules: Record<NpcId, ResolvedNpcSchedule> = {};

  for (const npcId of Object.keys(input.npcsById)) {
    const baseState = input.npcContent[npcId]?.baseSchedule[input.timeOfDay];
    if (baseState === undefined) continue;

    if (baseState !== 'work') {
      schedules[npcId] = { state: baseState };
      continue;
    }

    const workplace = reservations[npcId];
    schedules[npcId] = workplace ? { state: 'work', workplace } : { state: 'unplaced' };
  }

  return schedules;
}
