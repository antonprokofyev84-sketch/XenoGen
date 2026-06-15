import { diffCalendarDays } from '@/utils/diffCalendarDays';
import { resolveTimeSlotIndex } from '@/utils/timeOfDay';

export type TimeAdvanceResult = {
  newTime: number;
  daysPassed: number;
  oldTimeSlotIndex: number;
  newTimeSlotIndex: number;
};

const MINUTE_MS = 60 * 1000;

export function advanceWorldTime(oldTime: number, minutes: number): TimeAdvanceResult {
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const deltaMs = Math.round(safeMinutes * MINUTE_MS);
  const newTime = oldTime + deltaMs;

  return {
    newTime,
    daysPassed: Math.max(0, diffCalendarDays(oldTime, newTime)),
    oldTimeSlotIndex: resolveTimeSlotIndex(oldTime),
    newTimeSlotIndex: resolveTimeSlotIndex(newTime),
  };
}

export function minutesToMs(minutes: number): number {
  return Math.round(minutes * MINUTE_MS);
}
