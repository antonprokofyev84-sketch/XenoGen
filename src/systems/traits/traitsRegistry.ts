import { TRAITS_DB } from '@/data/traits';
import type { Trait } from '@/types/traits.types';

const traitsById: Record<string, Trait> = {};
const traitsByTag: Record<string, Trait[]> = {};

for (const trait of TRAITS_DB) {
  traitsById[trait.id] = trait;

  (trait.tags ?? []).forEach((tag) => {
    (traitsByTag[tag] ??= []).push(trait);
  });
}

export const TraitsRegistry = {
  getById: (id: string): Trait | undefined => traitsById[id],
  getByTag: (tag: string): Trait[] => traitsByTag[tag] ?? [],
  getStartingChoices: (): Trait[] => traitsByTag['startingChoice'] ?? [],
  byId: traitsById,
  all: TRAITS_DB,
};
