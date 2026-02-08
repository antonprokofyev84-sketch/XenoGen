import type { NarrativeMood } from '@/types/narrative.types';

// ========================
// Tension thresholds
// ========================

const TENSION_THRESHOLD_HOSTILE = 70;
const TENSION_THRESHOLD_NEUTRAL = 30;

/**
 * Derives a narrative mood from the current tension value.
 *
 * tension >= 70 → hostile
 * tension >= 30 → neutral
 * tension <  30 → friendly
 */
export function getMoodFromTension(tension: number): NarrativeMood {
  if (tension >= TENSION_THRESHOLD_HOSTILE) return 'hostile';
  if (tension >= TENSION_THRESHOLD_NEUTRAL) return 'neutral';
  return 'friendly';
}
