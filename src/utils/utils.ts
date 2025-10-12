/**
 * Creates a unique instance ID for an item.
 * Prefers crypto.randomUUID() if available, otherwise falls back to a time-based ID.
 */
export const makeInstanceId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `it_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
