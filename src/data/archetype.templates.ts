import type { ArchetypeTemplate } from '@/types/character.types';

export type StatDefinition = number | [base: number, random: number];

export const ARCHETYPE_TEMPLATES_DB: Record<string, ArchetypeTemplate> = {
  // --- COMMON ARCHETYPES ---
  raider_brawler: {
    id: 'raider_brawler',
    mainStats: { str: [5, 5], dex: -2 },
    skills: { melee: 10 },
  },
  raider_scout: {
    id: 'raider_scout',
    mainStats: { per: 5, dex: 2 },
    skills: { range: 5, survival: 10 },
  },

  // --- RARE ARCHETYPES ---
  raider_sniper: {
    id: 'raider_sniper',
    mainStats: { per: 15, dex: 5, str: -5 },
    skills: { range: 20 },
    traitsRequired: ['deadeye1'],
  },
  raider_medic: {
    id: 'raider_medic',
    mainStats: { int: 15, dex: 5 },
    skills: { medicine: [20, 10] },
  },

  // --- UNIQUE ARCHETYPES ---
  unique_butcher: {
    id: 'unique_butcher',
    mainStats: { str: 20, con: 15, dex: -10 },
    skills: { melee: 30 },
    traitsRequired: ['butcher_frenzy'],
  },
};

export const ARCHETYPES_BY_RARITY: Record<string, string[]> = {
  common: ['raider_brawler', 'raider_scout'],
  rare: ['raider_sniper', 'raider_medic'],
  unique: ['unique_butcher'],
};
