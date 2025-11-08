import type { Trait } from '@/types/traits.types';

export const TRAIT_TEMPLATES_DB: Trait[] = [
  // --- ADDICTIONS ---
  {
    id: 'alcoholic1',
    nameKey: 'traits.alcoholic1.name',
    descriptionKey: 'traits.alcoholic1.desc',
    tags: ['addiction', 'quirk', 'startingChoice'],
    group: 'alcoholic',
    isVisible: true,
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
            { kind: 'modifyProgress', id: 'alcoholic1', delta: 1, chance: 0.5 },
            { kind: 'setDuration', id: 'alcoholic1', value: 30 },
          ],
        },
        {
          if: [{ kind: 'hasTag', tag: 'alcoHeal' }],
          do: [
            {
              kind: 'removeTrait',
              id: 'alcoholic1',
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
          do: [{ kind: 'replaceTrait', id: 'alcoholic1', toId: 'alcoholic2' }],
        },
      ],
    },
  },

  {
    id: 'testTrait1',
    nameKey: 'testTrait1Name',
    descriptionKey: 'testTrait1Desc',
    tags: ['addiction', 'quirk', 'startingChoice'],
    group: '',
    isVisible: true,
    cost: 0,
    duration: 5,
    triggers: {
      onDayPass: [
        {
          if: [{ kind: 'mainStatCheck', stat: 'str', comparison: 'lte', value: 60 }],
          do: [{ kind: 'modifyMainStat', stat: 'str', delta: 1 }],
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
    isVisible: true,
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
    isVisible: true,
    duration: 1,
    mods: {
      will: -10,
      dex: -5,
    },
  },

  {
    id: 'heavyInjured',
    nameKey: 'traits.heavyInjured.name',
    descriptionKey: 'traits.heavyInjured.desc',
    tags: ['status', 'injury', 'negative'],
    isVisible: true,
    duration: 3,
    mods: {
      str: -15,
      dex: -15,
      con: -15,
      int: -15,
      per: -15,
      will: -15,
      initiative: -5,
      evasion: -20,
      melee: -20,
      range: -20,
      crafting: -20,
      science: -20,
      medicine: -20,
      charisma: -20,
      survival: -20,
    },
    triggers: {
      onDurationEnd: [
        {
          do: [{ kind: 'replaceTrait', id: 'heavyInjured', toId: 'injured' }],
        },
      ],
    },
  },
  {
    id: 'injured',
    nameKey: 'traits.injured.name',
    descriptionKey: 'traits.injured.desc',
    tags: ['status', 'injury', 'negative'],
    isVisible: true,
    duration: 3,
    mods: {
      str: -10,
      dex: -10,
      con: -10,
      int: -10,
      per: -10,
      will: -10,
      initiative: -3,
      evasion: -10,
      melee: -10,
      range: -10,
      crafting: -10,
      science: -10,
      medicine: -10,
    },
    triggers: {
      onDurationEnd: [
        {
          do: [{ kind: 'replaceTrait', id: 'injured', toId: 'lightInjured' }],
        },
      ],
    },
  },
  {
    id: 'lightInjured',
    nameKey: 'traits.lightInjured.name',
    descriptionKey: 'traits.lightInjured.desc',
    tags: ['status', 'injury', 'negative'],
    isVisible: true,
    duration: 2,
    mods: {
      str: -5,
      dex: -5,
      con: -5,
      int: -5,
      per: -5,
      will: -5,
      initiative: -1,
      evasion: -5,
      melee: -5,
      range: -5,
    },
    // Нет триггеров: просто исчезает
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
    isVisible: true,
    mods: {
      medicine: 15,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'heal' }],
          do: [{ kind: 'modifyProgress', id: 'medic1', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceTrait', id: 'medic1', toId: 'medic2' }],
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
    cost: 30,
    progress: 0,
    progressMax: 100,
    isVisible: true,
    mods: {
      survival: 15,
      range: 10,
      dex: 5,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'hunt' }],
          do: [{ kind: 'modifyProgress', id: 'hunter1', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceTrait', id: 'hunter1', toId: 'hunter2' }],
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
    isVisible: true,
    mods: {
      crafting: 15,
      science: 10,
    },
    triggers: {
      onAction: [
        {
          if: [{ kind: 'hasTag', tag: 'craft' }],
          do: [{ kind: 'modifyProgress', id: 'artificer1', delta: 1 }],
        },
      ],
      onProgressMax: [
        {
          do: [{ kind: 'replaceTrait', id: 'artificer1', toId: 'artificer2' }],
        },
      ],
    },
  },
];
