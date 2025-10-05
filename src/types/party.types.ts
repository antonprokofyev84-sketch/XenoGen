import type { Rarity } from './character.types';

// export type TravelMode = 'normal' | 'stealth' | 'fast';

export interface Captive {
  id: string; // Уникальный ID пленника
  templateId: string; // ID базового шаблона (e.g., 'generic_raider')
  rarity: Rarity;
}
