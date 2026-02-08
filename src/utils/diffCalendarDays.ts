export function diffCalendarDays(fromTime: number, toTime: number): number {
  const from = new Date(fromTime);
  const to = new Date(toTime);

  // Обнуляем время, оставляем только дату
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  const DAY_MS = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}
