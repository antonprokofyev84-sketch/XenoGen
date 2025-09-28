export type PoiType =
  | 'battle'
  | 'loot'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'event'
  | 'boss'
  | 'quest';

export interface Poi {
  id: string;
  poiTemplateId?: string;
  nameKey: string;
  descriptionKey: string;
  type: PoiType;

  rarity?: 'common' | 'rare' | 'unique';
  difficulty?: number; // 1-10
  duration?: number; // in days
  faction: string; // faction id

  discovered: boolean;
  perceptionThreshold: number; // минимальное значение восприятия для обнаружения

  //effect on day end
  effect?: {
    radius: number; // in cells
    threat: number;
    contamination: number;
    prosperity: number;
  };
}
