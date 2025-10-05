export interface MapCell {
  id: string; // e.g., "15-9"
  row: number;
  col: number;

  type: CellType;

  threatLevel: number; // 0-9 - текущая опасность
  threatProgress: number; // 0-99

  prosperityLevel: number; // 0-9 - текущее благосостояние
  prosperityProgress: number; // 0-99

  contaminationLevel: number; // 0-9 - заражение
  contaminationProgress: number; // 0-99
  // scavengeQuality: number;

  poi: string[];

  isVisited: boolean;
  explorationLevel: number;
  explorationDaysLeft: number | null; // null = explored
}

export type CellType = 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

export type CellProgressKey = 'threatProgress' | 'contaminationProgress' | 'prosperityProgress';
export type CellLevelKey = 'threatLevel' | 'contaminationLevel' | 'prosperityLevel';
