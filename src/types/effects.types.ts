import type { MainStatKey, SkillKey } from './character.types';

export type InteractionContext = {
  initiatorId: string;
  targetCharacterId?: string;
  targetFactionId?: string;
};

// export type TriggerRule = { when?: Condition[]; then: Effect[] };

export type CharacterTriggerRule = { when?: CharacterCondition[]; then: CharacterEffect[] };
export type PoiTriggerRule = { when?: PoiCondition[]; then: PoiEffect[] };
export type WorldTriggerRule = { when?: WorldCondition[]; then: WorldEffect[] };

// for now
export type CharacterCondition = unknown;
export type PoiCondition = unknown;
export type WorldCondition = unknown;

type EffectHelper = { chance?: number };
export type CharacterEffectCore =
  | {
      type: 'modifySkill';
      skill: SkillKey;
      delta: number;
    }
  | {
      type: 'modifyMainStat';
      stat: MainStatKey;
      delta: number;
    }
  | {
      type: 'modifyAffection';
      delta: number;
    };

export type WorldEffectCore =
  | {
      type: 'modifyTension';
      delta: number;
    }
  | {
      type: 'modifyReputation';
      factionId?: string;
      delta: number;
    };

export type PoiEffectCore = unknown;

export type CharacterEffect = CharacterEffectCore & EffectHelper;
export type WorldEffect = WorldEffectCore & EffectHelper;
export type PoiEffect = PoiEffectCore & EffectHelper;

export type ResolvedTriggerRules = {
  characters: Record<string, CharacterTriggerRule[]>; // characterId to rules
  pois?: Record<string, PoiTriggerRule[]>; // poiId to rules
  world: WorldTriggerRule[];
};

export type EffectLogs = {
  characters?: Record<string, CharacterEffectCore[]>;
  pois?: Record<string, PoiEffectCore[]>;
  world?: WorldEffectCore[];
};
