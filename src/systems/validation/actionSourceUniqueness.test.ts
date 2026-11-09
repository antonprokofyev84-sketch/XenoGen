import { describe, expect, it } from 'vitest';

import { createInitialDataBundle } from '@/data/initial/bundle';

import type { InitialDataBundle } from './validateInitialData';
import { validateInitialData } from './validateInitialData';

const actionConflicts = (bundle: InitialDataBundle) =>
  validateInitialData(bundle).filter((issue) => issue.message.startsWith('Action "'));

describe('Action source uniqueness', () => {
  it('accepts the canonical fixtures, including reuse in separate contexts', () => {
    expect(validateInitialData(createInitialDataBundle())).toEqual([]);
  });

  it('rejects a POI root Action also supplied by its template', () => {
    const bundle = createInitialDataBundle();
    const issues = actionConflicts({
      ...bundle,
      frames: {
        ...bundle.frames,
        fixtureHub: { ...bundle.frames.fixtureHub, actionIds: ['fixture:lookAround'] },
      },
    });
    expect(issues).toEqual([
      expect.objectContaining({
        path: 'POI-контекст "fixtureHub"',
        message: expect.stringContaining('fixture:lookAround'),
      }),
    ]);
  });

  it('rejects a slot root Action also supplied by the occupied slot', () => {
    const bundle = createInitialDataBundle();
    const hub = bundle.poiTemplates.fixtureHub;
    const visitor = hub.npcSlots!.freeTime![0];
    const issues = actionConflicts({
      ...bundle,
      poiTemplates: {
        ...bundle.poiTemplates,
        fixtureHub: {
          ...hub,
          npcSlots: {
            ...hub.npcSlots,
            freeTime: [{ ...visitor, actionIds: ['fixture:chatWithVisitor'] }],
          },
        },
      },
    });
    expect(issues).toHaveLength(visitor.candidateNpcIds.length);
    expect(issues.every((issue) => issue.message.includes('fixture:chatWithVisitor'))).toBe(true);
  });

  it('rejects a personal Action also supplied by a quest stage', () => {
    const bundle = createInitialDataBundle();
    expect(
      actionConflicts({
        ...bundle,
        npcs: {
          ...bundle.npcs,
          fixtureKeeper: {
            ...bundle.npcs.fixtureKeeper,
            actionIds: ['fixture:askKeeperAboutSite'],
          },
        },
      }),
    ).toEqual([
      expect.objectContaining({ message: expect.stringContaining('fixture:askKeeperAboutSite') }),
    ]);
  });

  it('rejects the same Action supplied by two quests that can coexist', () => {
    const bundle = createInitialDataBundle();
    expect(
      actionConflicts({
        ...bundle,
        quests: {
          ...bundle.quests,
          otherQuest: {
            name: 'Another quest',
            description: 'A simultaneous binding',
            stages: {
              initialStage: { actionIdsByTarget: { fixtureKeeper: ['fixture:askKeeperForWork'] } },
            },
          },
        },
      }),
    ).toEqual([
      expect.objectContaining({ message: expect.stringContaining('fixture:askKeeperForWork') }),
    ]);
  });

  it('allows one quest to reuse an Action in mutually exclusive stages', () => {
    const bundle = createInitialDataBundle();
    const quest = bundle.quests.fixtureQuest;
    expect(
      actionConflicts({
        ...bundle,
        quests: {
          ...bundle.quests,
          fixtureQuest: {
            ...quest,
            stages: {
              ...quest.stages,
              report: { actionIdsByTarget: { fixtureKeeper: ['fixture:askKeeperForWork'] } },
            },
          },
        },
      }),
    ).toEqual([]);
  });

  it('allows root Actions to be reused by internal Frames', () => {
    const bundle = createInitialDataBundle();
    expect(
      actionConflicts({
        ...bundle,
        frames: {
          ...bundle.frames,
          'fixtureHub/keeper:inner': {
            ...bundle.frames['fixtureHub/keeper:inner'],
            actionIds: ['fixture:dailyRumor'],
          },
        },
      }),
    ).toEqual([]);
  });
});
