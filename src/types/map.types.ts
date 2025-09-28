export interface MapCell {
  id: string; // e.g., "15-9"
  row: number;
  col: number;

  type: 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

  threatLevel: number; // 0-9 - текущая опасность
  threatProgress: number; // 0-99

  prosperityLevel: number; // 0-9 - текущее благосостояние
  prosperityProgress: number; // 0-99

  contaminationLevel: number; // 0-9 - заражение
  contaminationProgress: number; // 0-99
  // scavengeQuality: number;

  poi: string[];

  visited: boolean;
  explorationDaysLeft: number | null; // null = explored
}
