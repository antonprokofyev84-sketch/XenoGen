/**
 * Creates a unique instance ID for an item.
 * Prefers crypto.randomUUID() if available, otherwise falls back to a time-based ID.
 */
export const makeInstanceId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const stripLastUnderscoreSegment = (value: string): string => {
  const index = value.lastIndexOf('_');
  return index === -1 ? value : value.slice(0, index);
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
