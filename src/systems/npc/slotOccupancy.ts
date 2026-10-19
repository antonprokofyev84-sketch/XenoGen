import type { Rng } from '@/systems/rolls/rng';
import { defaultRng, pickOne, rollChance } from '@/systems/rolls/rng';
import type { NpcId, PoiId, SlotId } from '@/types/ids.types';
import type { NpcSlotGroup, OccupancyState, ResolvedNpcSchedule } from '@/types/occupancy.types';
import type { InitialNpcSlots, RuntimeSlotAssignments } from '@/types/poiContent.types';

/**
 * Фактическое заполнение slots одного POI.
 *
 * Алгоритм намеренно простой и не ищет оптимального распределения: группы
 * обходятся в порядке `work → freeTime → home`, slots внутри группы — в
 * порядке массива template. Первый обработанный slot получает преимущество,
 * поэтому подходящий нескольким slots NPC занимает первый из них.
 */

const SLOT_GROUP_ORDER: readonly NpcSlotGroup[] = ['work', 'freeTime', 'home'];

export interface SlotOccupancyInput {
  poiId: PoiId;
  npcSlots: InitialNpcSlots | undefined;
  schedulesByNpcId: Record<NpcId, ResolvedNpcSchedule>;
  assignments: RuntimeSlotAssignments;

  /** Занят ли NPC в другом, уже разрешённом POI текущего time slot. */
  isNpcPlaced: (npcId: NpcId) => boolean;

  rng?: Rng;
}

export function resolvePoiSlotOccupancy({
  poiId,
  npcSlots,
  schedulesByNpcId,
  assignments,
  isNpcPlaced,
  rng = defaultRng,
}: SlotOccupancyInput): Partial<Record<SlotId, NpcId>> {
  const occupantsBySlotId: Partial<Record<SlotId, NpcId>> = {};
  const takenNpcIds = new Set<NpcId>();

  const isFree = (npcId: NpcId): boolean => !takenNpcIds.has(npcId) && !isNpcPlaced(npcId);

  /**
   * Рабочее место зарезервировано глобально, поэтому work slot занимает
   * только NPC, закреплённый именно за ним. Как следствие work slots
   * закрытого POI остаются пустыми: такой POI резервaции не выдаёт.
   */
  const isCompatible = (npcId: NpcId, group: NpcSlotGroup, slotId: SlotId): boolean => {
    const schedule = schedulesByNpcId[npcId];
    if (!schedule || schedule.state !== group) return false;
    if (group !== 'work') return true;

    return schedule.workplace?.poiId === poiId && schedule.workplace.slotId === slotId;
  };

  const occupy = (slotId: SlotId, npcId: NpcId): void => {
    occupantsBySlotId[slotId] = npcId;
    takenNpcIds.add(npcId);
  };

  for (const group of SLOT_GROUP_ORDER) {
    for (const slot of npcSlots?.[group] ?? []) {
      const assignedNpcId = assignments[poiId]?.[slot.id];

      if (assignedNpcId !== undefined) {
        // «либо назначенный NPC, либо никто»: без броска chance и без подмены
        // авторским кандидатом, если назначенный NPC недоступен.
        if (isCompatible(assignedNpcId, group, slot.id) && isFree(assignedNpcId)) {
          occupy(slot.id, assignedNpcId);
        }
        continue;
      }

      if (!rollChance(rng, slot.chance ?? 1)) continue;

      const candidateNpcIds = slot.candidateNpcIds.filter(
        (npcId) => isCompatible(npcId, group, slot.id) && isFree(npcId),
      );

      const chosenNpcId = pickOne(rng, candidateNpcIds);
      if (chosenNpcId === undefined) continue;

      occupy(slot.id, chosenNpcId);
    }
  }

  return occupantsBySlotId;
}

/**
 * Снимает размещение и назначения POI.
 *
 * Назначения очищаются именно здесь: в остальных случаях они живут до явной
 * команды игрока и переживают смену time slot.
 */
export function clearPoiOccupancy(occupancy: OccupancyState, poiId: PoiId): void {
  const occupants = occupancy.slotOccupants[poiId];

  if (occupants) {
    for (const npcId of Object.values(occupants)) {
      if (npcId === undefined) continue;

      delete occupancy.npcPlacements[npcId];
    }
  }

  delete occupancy.slotOccupants[poiId];
  delete occupancy.resolvedPoiIds[poiId];
  delete occupancy.assignments[poiId];
}

/**
 * Первый занятый slot POI.
 *
 * Временный мост для кода, написанного под «один NPC на POI». Runtime
 * взаимодействий и presentation работают с парой `slotId + npcId` и этот
 * helper не используют.
 */
export function getFirstSlotOccupant(occupancy: OccupancyState, poiId: PoiId): NpcId | undefined {
  const occupants = occupancy.slotOccupants[poiId];
  if (!occupants) return undefined;

  return Object.values(occupants).find((npcId) => npcId !== undefined);
}
