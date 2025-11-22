import { initialMainStatValue } from '@/state/constants';
import type { Character, CharacterTemplate } from '@/types/character.types';

export const PROTAGONIST_TEMPLATE: Character = {
  id: 'protagonist',
  templateId: 'protagonist',
  name: 'Hero',
  hp: 1,
  stamina: 1,
  baseStats: {
    age: 30,
    gameAge: 0,
    beauty: 5,
    fame: 0,
    baseHp: 30,
    baseStamina: 20,
    baseInitiative: 5,
    baseArmor: 0,
    baseCritChance: 5,
    baseMeleeDamage: 1,
  },
  mainStats: {
    str: initialMainStatValue,
    dex: initialMainStatValue,
    con: initialMainStatValue,
    per: initialMainStatValue,
    int: initialMainStatValue,
    will: initialMainStatValue,
  },
  skills: {
    melee: 0,
    range: 0,
    crafting: 0,
    science: 0,
    medicine: 0,
    charisma: 0,
    survival: 0,
  },
};

export const CHARACTER_TEMPLATES_DB: Record<string, CharacterTemplate> = {
  // protagonist: {
  //   id: 'protagonist',
  //   name: 'Hero',
  //   baseStats: {
  //     age: 30,
  //     gameAge: 0,
  //     beauty: 5,
  //     fame: 0,
  //     baseHp: 30,
  //     baseStamina: 20,
  //     baseInitiative: 5,
  //     baseArmor: 0,
  //     baseCritChance: 5,
  //     baseMeleeDamage: 1,
  //   },
  //   mainStats: {
  //     str: initialMainStatValue,
  //     dex: initialMainStatValue,
  //     con: initialMainStatValue,
  //     per: initialMainStatValue,
  //     int: initialMainStatValue,
  //     will: initialMainStatValue,
  //   },
  //   skills: {
  //     melee: 0,
  //     range: 0,
  //     crafting: 0,
  //     science: 0,
  //     medicine: 0,
  //     charisma: 0,
  //     survival: 0,
  //   },
  // },
};
