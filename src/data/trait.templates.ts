import type { TraitTemplate } from '@/types/traits.types';

export const TRAIT_TEMPLATES_DB: TraitTemplate[] = [
  // === Battle-Hardened ===
  {
    id: 'battleHardened',
    nameKey: 'traits.battleHardened.name',
    descriptionKey: 'traits.battleHardened.desc',
    levels: {
      0: {
        tags: ['quirk', 'positive', 'startingChoice'],
        isVisible: true,
        cost: 50,
        progress: 0,
        progressMax: 2,
        triggers: {
          onBattleWin: [{ do: [{ kind: 'modifyProgress', id: 'battleHardened', delta: 1 }] }],
          onBattleLose: [{ do: [{ kind: 'modifyProgress', id: 'battleHardened', delta: -2 }] }],
          onBattleFlee: [{ do: [{ kind: 'modifyProgress', id: 'battleHardened', delta: -1 }] }],
          onProgressMax: [{ do: [{ kind: 'levelUpTrait', id: 'battleHardened' }] }],
        },
      },
      1: {
        tags: ['quirk', 'positive'],
        isVisible: true,
        mods: {
          skills: { melee: 10, range: 10 },
          secondaryStats: { evasion: 5 },
        },
      },
    },
  },

  // === ADDICTIONS ===
  {
    id: 'alcoholic',
    nameKey: 'traits.alcoholic1.name',
    descriptionKey: 'traits.alcoholic1.desc',
    levels: {
      0: {
        tags: ['addiction', 'quirk', 'startingChoice'],
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
                { kind: 'modifyProgress', id: 'alcoholic', delta: 1, chance: 0.5 },
                { kind: 'setDuration', id: 'alcoholic', value: 30 },
              ],
            },
            {
              if: [{ kind: 'hasTag', tag: 'alcoHeal' }],
              do: [{ kind: 'removeTrait', id: 'alcoholic' }],
            },
          ],
          onDayPass: [{ do: [{ kind: 'addTrait', id: 'hangover', params: { duration: 1 } }] }],
          onProgressMax: [{ do: [{ kind: 'levelUpTrait', id: 'alcoholic' }] }],
        },
      },
      1: {
        tags: ['addiction', 'quirk'],
        isVisible: true,
      },
    },
  },

  // === TEST TRAIT ===
  {
    id: 'testTrait1',
    nameKey: 'testTrait1Name',
    descriptionKey: 'testTrait1Desc',
    levels: {
      0: {
        tags: ['addiction', 'quirk', 'startingChoice'],
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
    },
  },

  // === TEMPORARY STATUSES ===
  {
    id: 'buzzed',
    nameKey: 'traits.buzzed.name',
    descriptionKey: 'traits.buzzed.desc',
    levels: {
      0: {
        tags: ['status', 'temporary'],
        isVisible: true,
        duration: 1,
        mods: {
          mainStats: { will: 10, per: -5 },
        },
      },
    },
  },
  {
    id: 'hangover',
    nameKey: 'traits.hangover.name',
    descriptionKey: 'traits.hangover.desc',
    levels: {
      0: {
        tags: ['status', 'temporary'],
        isVisible: true,
        duration: 1,
        mods: {
          mainStats: { will: -10, dex: -5 },
        },
      },
    },
  },

  // === INJURY ===
  {
    id: 'injury',
    nameKey: 'traits.injury.name',
    descriptionKey: 'traits.injury.desc',
    levels: {
      0: {
        // Light
        tags: ['status', 'injury', 'negative'],
        isVisible: true,
        duration: 2,
        mods: {
          mainStats: { str: -5, dex: -5, con: -5, int: -5, per: -5, will: -5 },
          secondaryStats: { initiative: -1, evasion: -5 },
          skills: { melee: -5, range: -5 },
        },
        triggers: { onDurationEnd: [{ do: [{ kind: 'levelUpTrait', id: 'injury' }] }] },
      },
      1: {
        // Injured
        tags: ['status', 'injury', 'negative'],
        isVisible: true,
        duration: 3,
        mods: {
          mainStats: { str: -10, dex: -10, con: -10, int: -10, per: -10, will: -10 },
          secondaryStats: { initiative: -3, evasion: -10 },
          skills: {
            melee: -10,
            range: -10,
            crafting: -10,
            science: -10,
            medicine: -10,
          },
        },
        triggers: { onDurationEnd: [{ do: [{ kind: 'levelUpTrait', id: 'injury' }] }] },
      },
      2: {
        // Heavy
        tags: ['status', 'injury', 'negative'],
        isVisible: true,
        duration: 3,
        mods: {
          mainStats: { str: -15, dex: -15, con: -15, int: -15, per: -15, will: -15 },
          secondaryStats: { initiative: -5, evasion: -20 },
          skills: {
            melee: -20,
            range: -20,
            crafting: -20,
            science: -20,
            medicine: -20,
            charisma: -20,
            survival: -20,
          },
        },
      },
    },
  },

  // === SCARS ===
  {
    id: 'battleScars',
    nameKey: 'trait.battleScars.name',
    descriptionKey: 'trait.battleScars.desc',
    category: 'scars',
    maxCategoryCount: 1,
    levels: {
      0: {
        tags: ['scar', 'cosmetic', 'positive'],
        isVisible: true,
        mods: {
          skills: { charisma: 5 }, // cha -> charisma
        },
      },
      1: {
        tags: ['scar', 'cosmetic', 'positive'],
        isVisible: true,
        mods: {
          skills: { charisma: 10 },
        },
      },
    },
  },
  {
    id: 'uglyScars',
    nameKey: 'trait.uglyScars.name',
    descriptionKey: 'trait.uglyScars.desc',
    category: 'scars',
    maxCategoryCount: 1,
    levels: {
      0: {
        tags: ['scar', 'cosmetic', 'negative'],
        isVisible: true,
        mods: {
          skills: { charisma: -2 },
          mainStats: { will: 5 },
          // intimidate пока убрал, так как его нет в SkillKey
        },
      },
      1: {
        tags: ['scar', 'cosmetic', 'negative'],
        isVisible: true,
        mods: {
          skills: { charisma: -5 },
          mainStats: { will: 10 },
        },
      },
    },
  },

  // === PROFESSIONS ===
  {
    id: 'medic',
    nameKey: 'traits.medic1.name',
    descriptionKey: 'traits.medic1.desc',
    category: 'profession',
    maxCategoryCount: 2,
    levels: {
      0: {
        tags: ['profession', 'startingChoice'],
        isVisible: true,
        cost: 20,
        progress: 0,
        progressMax: 100,
        mods: {
          skills: { medicine: 15 },
        },
        triggers: {
          onAction: [
            {
              if: [{ kind: 'hasTag', tag: 'heal' }],
              do: [{ kind: 'modifyProgress', id: 'medic', delta: 1 }],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpTrait', id: 'medic' }] }],
        },
      },
      1: {
        tags: ['profession'],
        isVisible: true,
        mods: {
          skills: { medicine: 25 },
        },
      },
    },
  },
  {
    id: 'hunter',
    nameKey: 'traits.hunter1.name',
    descriptionKey: 'traits.hunter1.desc',
    category: 'profession',
    maxCategoryCount: 2,
    levels: {
      0: {
        tags: ['profession', 'startingChoice'],
        isVisible: true,
        cost: 30,
        progress: 0,
        progressMax: 100,
        mods: {
          skills: { survival: 15, range: 10 },
          mainStats: { dex: 5 },
        },
        triggers: {
          onAction: [
            {
              if: [{ kind: 'hasTag', tag: 'hunt' }],
              do: [{ kind: 'modifyProgress', id: 'hunter', delta: 1 }],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpTrait', id: 'hunter' }] }],
        },
      },
      1: {
        tags: ['profession'],
        isVisible: true,
      },
    },
  },
  {
    id: 'artificer',
    nameKey: 'traits.artificer1.name',
    descriptionKey: 'traits.artificer1.desc',
    category: 'profession',
    maxCategoryCount: 2,
    levels: {
      0: {
        tags: ['profession', 'startingChoice'],
        isVisible: true,
        cost: 20,
        progress: 0,
        progressMax: 100,
        mods: {
          skills: { crafting: 15, science: 10 },
        },
        triggers: {
          onAction: [
            {
              if: [{ kind: 'hasTag', tag: 'craft' }],
              do: [{ kind: 'modifyProgress', id: 'artificer', delta: 1 }],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpTrait', id: 'artificer' }] }],
        },
      },
      1: {
        tags: ['profession'],
        isVisible: true,
      },
    },
  },
];
