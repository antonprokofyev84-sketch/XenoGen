import type { CharacterTemplate, Character } from '@/types/character.types';
import { initiatMainStatValue } from '@/state/constants';

export const PROTAGONIST_TEMPLATE: Character = {
  id: 'protagonist',
  name: 'Hero',
  hp: 1,
  baseStats: {
    age: 30,
    gameAge: 0,
    beauty: 5,
    fame: 0,
    baseHp: 30,
    baseInitiative: 5,
    baseArmor: 0,
    baseCritChance: 5,
    baseDamage: 1,
    baseAccuracy: 30,
  },
  mainStats: {
    str: initiatMainStatValue,
    dex: initiatMainStatValue,
    con: initiatMainStatValue,
    per: initiatMainStatValue,
    int: initiatMainStatValue,
    will: initiatMainStatValue,
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
  protagonist: {
    id: 'protagonist',
    name: 'Hero',
    baseStats: {
      age: 30,
      gameAge: 0,
      beauty: 5,
      fame: 0,
      baseHp: 30,
      baseInitiative: 5,
      baseArmor: 0,
      baseCritChance: 5,
      baseDamage: 1,
      baseAccuracy: 30,
    },
    mainStats: {
      str: initiatMainStatValue,
      dex: initiatMainStatValue,
      con: initiatMainStatValue,
      per: initiatMainStatValue,
      int: initiatMainStatValue,
      will: initiatMainStatValue,
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
  },
};
