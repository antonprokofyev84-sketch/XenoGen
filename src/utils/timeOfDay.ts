import { HOURS_PER_TIME_SLOT, TIME_OF_DAY_IDS, TIME_OF_DAY_START_HOURS } from '@/constants';
import type { TimeOfDayId } from '@/constants';

export const resolveTimeSlotIndexFromHour = (hour: number): number => {
  const slotIndex = Math.floor(hour / HOURS_PER_TIME_SLOT);
  return Math.min(Math.max(slotIndex, 0), TIME_OF_DAY_IDS.length - 1);
};

export const resolveTimeSlotIndex = (timestamp: number): number => {
  return resolveTimeSlotIndexFromHour(new Date(timestamp).getHours());
};

export const resolveTimeOfDayFromHour = (hour: number): TimeOfDayId => {
  const slotIndex = resolveTimeSlotIndexFromHour(hour);

  return TIME_OF_DAY_IDS[slotIndex];
};

export const resolveTimeOfDay = (timestamp: number): TimeOfDayId => {
  return resolveTimeOfDayFromHour(new Date(timestamp).getHours());
};

export const getNextTimeOfDayStart = (timestamp: number, timeOfDay: TimeOfDayId): number => {
  const nextBoundary = new Date(timestamp);
  const startHour = TIME_OF_DAY_START_HOURS[timeOfDay];

  nextBoundary.setHours(startHour, 0, 0, 0);

  if (nextBoundary.getTime() <= timestamp) {
    nextBoundary.setDate(nextBoundary.getDate() + 1);
  }

  return nextBoundary.getTime();
};
