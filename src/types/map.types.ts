export interface MapCellState {
  id: string; // e.g., "15-9"
  row: number;
  col: number;

  type: 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

  threatLevel: number;
  contamination: number;
  prosperity: number;
  // scavengeQuality: number;

  poi: string[];

  visited: boolean;
  explorationDaysLeft: number | null; // null = explored
}
