import type { Trait } from '@/types/traits.types';

export const TRAITS_DB: Trait[] = [
  // --- ADDICTIONS ---
  {
    id: 'alcoholic1',
    nameKey: 'traits.alcoholic1.name',
    descriptionKey: 'traits.alcoholic1.desc',
    tags: ['addiction', 'quirk', 'startingChoice'],
    group: 'alcoholic',
    visible: true,
    cost: -50,
    duration: 30,
    progress: 0,
    progressMax: 50,
    triggers: {
      onItemConsume: [
        {
          if: [{ kind: 'hasTag', tag: 'alcohol' }],
          do: [
            { kind: 'addTrait', id: 'buzzed', params: { duration: 1 } },
            { kind: 'removeTrait', id: 'withdrawal' },
            { kind: 'modifyProgress', delta: 1, chance: 0.5 },
            { kind: 'setDuration', value: 30 },
          ],
        },
        {
          if: [{ kind: 'hasTag', tag: 'alcoHeal' }],
          do: [
            {
              kind: 'removeSelf',
            },
          ],
        },
      ],
      onDayPass: [
        {
          do: [{ kind: 'addTrait', id: 'hangover', params: { duration: 1 } }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceSelf', toId: 'alcoholic2' }],
        },
      ],
    },
  },

  // --- TEMPORARY STATUSES ---
  {
    id: 'buzzed',
    nameKey: 'traits.buzzed.name',
    descriptionKey: 'traits.buzzed.desc',
    tags: ['status', 'temporary'],
    visible: true,
    duration: 1,
    mods: {
      will: 10,
      per: -5,
    },
  },
  {
    id: 'hangover',
    nameKey: 'traits.hangover.name',
    descriptionKey: 'traits.hangover.desc',
    tags: ['status', 'temporary'],
    visible: true,
    duration: 1,
    mods: {
      will: -10,
      dex: -5,
    },
  },

  // --- PROFESSIONS ---
  {
    id: 'medic1',
    nameKey: 'traits.medic1.name',
    descriptionKey: 'traits.medic1.desc',
    tags: ['profession', 'startingChoice'],
    group: 'medic',
    category: 'profession',
    maxCategoryCount: 2,
    cost: 20,
    progress: 0,
    progressMax: 100,
    visible: true,
    mods: {
      medicine: 15,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'heal' }],
          do: [{ kind: 'modifyProgress', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceSelf', toId: 'medic2' }],
        },
      ],
    },
  },
  {
    id: 'hunter1',
    nameKey: 'traits.hunter1.name',
    descriptionKey: 'traits.hunter1.desc',
    tags: ['profession', 'startingChoice'],
    group: 'hunter',
    category: 'profession',
    maxCategoryCount: 2,
    cost: 20,
    progress: 0,
    progressMax: 100,
    visible: true,
    mods: {
      survival: 15,
      range: 10,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'hunt' }],
          do: [{ kind: 'modifyProgress', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceSelf', toId: 'hunter2' }],
        },
      ],
    },
  },
  {
    id: 'artificer1',
    nameKey: 'traits.artificer1.name',
    descriptionKey: 'traits.artificer1.desc',
    tags: ['profession', 'startingChoice'],
    group: 'artificer', // Added for exclusion
    category: 'profession',
    maxCategoryCount: 2,
    cost: 20,
    progress: 0,
    progressMax: 100,
    visible: true,
    mods: {
      crafting: 15,
      science: 10,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'craft' }],
          do: [{ kind: 'modifyProgress', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceSelf', toId: 'artificer2' }],
        },
      ],
    },
  },
];
