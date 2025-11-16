import type { MainStatKey, SkillKey } from '@/types/character.types';

export type EffectLog =
  // --- прогресс / длительность ---
  | { type: 'modifyProgress'; traitId: string; delta: number; newValue: number }
  | { type: 'setProgress'; traitId: string; newValue: number }
  | { type: 'setDuration'; traitId: string; newValue: number }

  // --- сами трейты ---
  | { type: 'addTrait'; traitId: string; level: number }
  | { type: 'removeTrait'; traitId: string }
  | { type: 'replaceTrait'; fromId: string; toId: string }
  | { type: 'levelUpTrait'; traitId: string; deltaLevel: number; newLevel: number }
  | { type: 'levelDownTrait'; traitId: string; deltaLevel: number; newLevel: number }
  | { type: 'setTraitLevel'; traitId: string; newLevel: number }

  // --- статы / скиллы ---
  | { type: 'modifyMainStat'; stat: MainStatKey; delta: number; newValue: number }
  | { type: 'setMainStat'; stat: MainStatKey; newValue: number }
  | { type: 'modifySkill'; skill: SkillKey; delta: number; newValue: number }
  | { type: 'setSkill'; skill: SkillKey; newValue: number };
