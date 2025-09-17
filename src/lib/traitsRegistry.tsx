import { TRAITS_DB } from '@/data/traits';
import type { Trait } from '@/types/traits.types';

const byTag: Record<string, Trait[]> = {};
const byId: Record<string, Trait> = {};

for (const t of TRAITS_DB) {
  byId[t.id] = t;
  (t.tags ?? []).forEach((tag) => {
    (byTag[tag] ??= []).push(t);
  });
}

export const TraitsRegistry = {
  get: (id: string) => byId[id],
  listByTag: (tag: string) => byTag[tag] ?? [],
  listStartingChoices: () => byTag['startingChoice'] ?? [],
};
