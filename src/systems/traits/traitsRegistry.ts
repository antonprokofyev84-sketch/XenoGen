import { TRAIT_TEMPLATES_DB } from '@/data/trait.templates';
import type { Trait } from '@/types/traits.types';

const traitsById: Record<string, Trait> = {};
const traitsByTag: Record<string, Trait[]> = {};

for (const trait of TRAIT_TEMPLATES_DB) {
  traitsById[trait.id] = trait;

  (trait.tags ?? []).forEach((tag) => {
    (traitsByTag[tag] ??= []).push(trait);
  });
}

export const traitsRegistry = {
  getById: (id: string): Trait | undefined => traitsById[id],
  getByTag: (tag: string): Trait[] => traitsByTag[tag] ?? [],
  getStartingChoices: (): Trait[] => traitsByTag['startingChoice'] ?? [],
  byId: traitsById,
  all: TRAIT_TEMPLATES_DB,
};
