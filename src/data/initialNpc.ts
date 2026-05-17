import type { NpcDetails, NpcSchedule } from '@/types/npc.types';

const createNpcSchedule = (actions: NpcSchedule['0']['action'][]): NpcSchedule => {
  return Object.fromEntries(actions.map((action, slot) => [slot, { action }])) as NpcSchedule;
};

export const INITIAL_NPCS: NpcDetails[] = [
  {
    id: 'test_bartender',
    name: 'Mara Voss',
    factionId: 'testNeutral',
    affection: 0,
    lastDateMet: null,
    services: ['rumors', 'insult'],
    schedule: createNpcSchedule(['hidden', 'hidden', 'hidden', 'work', 'work', 'work']),
  },
  {
    id: 'test_waitress',
    name: 'Lena Pike',
    factionId: 'testNeutral',
    affection: 0,
    lastDateMet: null,
    services: ['rumors', 'insult'],
    schedule: createNpcSchedule(['hidden', 'hidden', 'hidden', 'work', 'work', 'work']),
  },
  {
    id: 'test_drunkard',
    name: 'Jory Flint',
    factionId: 'testNeutral',
    affection: 0,
    lastDateMet: null,
    services: ['rumors', 'insult'],
    schedule: createNpcSchedule([
      'hidden',
      'hidden',
      'hidden',
      'free_time',
      'free_time',
      'free_time',
    ]),
  },
];
