import type { InteractionService } from './interaction.types';

export type NpcScheduleAction = 'work' | 'free_time' | 'hidden';

export interface NpcScheduleEntry {
  action: NpcScheduleAction;
}

export type NpcSchedule = Record<number, NpcScheduleEntry>;

export interface NpcDetails {
  id: string;
  name: string;
  factionId: string;
  affection: number;
  lastDateMet: number | null;
  services: InteractionService[];
  schedule: NpcSchedule;
}
