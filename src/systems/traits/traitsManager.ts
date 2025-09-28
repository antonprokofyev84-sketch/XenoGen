import type { ActiveTrait, TraitId, TriggerRule } from '@/types/traits.types';

import { TraitsRegistry } from './traitsRegistry';

export const TraitsManager = {
  canAddTrait: (newTraitId: TraitId, currentTraits: ActiveTrait[]): boolean => {
    const newTrait = TraitsRegistry.getById(newTraitId);
    if (!newTrait) return false;

    // 1) Взаимоисключение по group (например, alcoholism уровнями)
    if (newTrait.group) {
      const hasConflict = currentTraits.some((trait) => {
        return trait?.group === newTrait.group;
      });
      if (hasConflict) return false;
    }

    // 2) Лимит по категории (например, profession ≤ 2)
    if (newTrait.category && newTrait.maxCategoryCount) {
      const currentCount = currentTraits.reduce((count, trait) => {
        return trait?.category === newTrait.category ? count + 1 : count;
      }, 0);
      if (currentCount >= newTrait.maxCategoryCount) return false;
    }

    return true;
  },

  computeOnDayPassForActor: (
    currentTraits: ActiveTrait[],
  ): { updatedTraits: ActiveTrait[]; effects: TriggerRule[] } => {
    // reduse duration, remove expired
    const updatedTraits: ActiveTrait[] = [];
    const effects: TriggerRule[] = [];

    for (const trait of currentTraits) {
      const nextTrait =
        typeof trait.duration === 'number' ? { ...trait, duration: trait.duration - 1 } : trait;

      //check if trait is still active
      if (!(nextTrait.duration === undefined || nextTrait.duration > 0)) continue;

      updatedTraits.push(nextTrait);

      const baseTrait = TraitsRegistry.getById(nextTrait.id);
      if (baseTrait?.triggers?.onDayPass) {
        effects.push(...baseTrait.triggers.onDayPass);
      }
    }

    return { updatedTraits, effects };
  },
};
