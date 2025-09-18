import { TraitsRegistry } from './traitsRegistry';
import type { TraitId, ActiveTrait } from '@/types/traits.types';

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
};
