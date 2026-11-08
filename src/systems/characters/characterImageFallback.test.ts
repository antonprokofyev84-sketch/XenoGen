import { afterEach, describe, expect, it } from 'vitest';

import { createInitialDataBundle } from '@/data/initial/bundle';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { resolveNpcImage, resolveNpcSilhouette } from '@/systems/npc/npcImageResolver';
import { validateInitialData } from '@/systems/validation/validateInitialData';
import type { InitialNpc } from '@/types/npcContent.types';

import { resolveCharacterSilhouette } from './characterImageFallback';

const fallbackNpcId = 'silhouetteTestNpc';
afterEach(() => {
  delete INITIAL_NPCS[fallbackNpcId];
});

describe('character silhouette fallback', () => {
  it('uses distinct male and female assets and a stable default when gender is absent', () => {
    expect(resolveCharacterSilhouette('female')).not.toBe(resolveCharacterSilhouette('male'));
    expect(resolveCharacterSilhouette()).toBe(resolveCharacterSilhouette('male'));
  });

  it('keeps the individual NPC image when one exists', () => {
    expect(resolveNpcImage('fixtureKeeper')).not.toBe(resolveNpcSilhouette('fixtureKeeper'));
  });

  it('uses authored NPC gender when there is no individual image', () => {
    INITIAL_NPCS[fallbackNpcId] = { ...INITIAL_NPCS.fixtureKeeper, gender: 'female' };
    expect(resolveNpcImage(fallbackNpcId)).toBe(resolveCharacterSilhouette('female'));
  });

  it('does not create an image when no NPC should be shown', () => {
    expect(resolveNpcImage(undefined)).toBeUndefined();
  });

  it.each([undefined, 'invalid'])(
    'rejects missing or invalid authored NPC gender: %s',
    (gender) => {
      const bundle = createInitialDataBundle();
      const invalidNpc = {
        ...INITIAL_NPCS.fixtureKeeper,
        gender: gender as unknown as InitialNpc['gender'],
      };
      const issues = validateInitialData({
        ...bundle,
        npcs: { ...bundle.npcs, invalidGenderNpc: invalidNpc },
      });
      expect(issues.some((issue) => issue.path === 'INITIAL_NPCS.invalidGenderNpc.gender')).toBe(
        true,
      );
    },
  );
});
