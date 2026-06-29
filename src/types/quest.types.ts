import type { MainStatKey, SkillKey } from './character.types';
import type { InteractionEffectDescriptor, InteractionService } from './interaction.types';
import type { NarrativeOutcomeEntry } from './narrative.types';

export const INITIAL_QUEST_STAGE_ID = 'initialStage' as const;

export type QuestId = string;
export type QuestStageId = string;
export type QuestTargetId = string;

export type ItemId = string;
export type EnemyTypeId = string;
export type NpcId = string;
export type FactionId = string;

export type QuestCategory = 'main' | 'side' | 'job' | 'generated';

export type QuestConditionValue = string | number | boolean;

export interface QuestConditionMatch {
  min?: number;
  max?: number;
  exact?: QuestConditionValue;
}

export type QuestVisibilityCondition =
  | ({ type: 'skill'; skillId: SkillKey } & QuestConditionMatch)
  | ({ type: 'stat'; statId: MainStatKey } & QuestConditionMatch)
  | ({ type: 'item'; itemId: ItemId } & QuestConditionMatch)
  | ({ type: 'defeated'; enemyTypeId: EnemyTypeId } & QuestConditionMatch)
  | ({ type: 'affection'; npcId: NpcId } & QuestConditionMatch)
  | ({ type: 'reputation'; factionId: FactionId } & QuestConditionMatch);

export type QuestTransitionEffect =
  | {
      type: 'setQuestStage';
      stageId: QuestStageId;
    }
  | {
      type: 'completeQuest';
    }
  | {
      type: 'failQuest';
    };

export type QuestItemEffect =
  | {
      type: 'addItem';
      itemId: ItemId;
      count: number;
    }
  | {
      type: 'removeItem';
      itemId: ItemId;
      count: number;
    };

export type QuestStageEffect =
  | InteractionEffectDescriptor
  | QuestTransitionEffect
  | QuestItemEffect;

export interface QuestStageDefinition {
  title?: string;
  description?: string;

  targetId: QuestTargetId;
  serviceId: InteractionService;

  visibilityConditions?: QuestVisibilityCondition[];
  effects: QuestStageEffect[];
}

export type QuestStageMap =
  Record<typeof INITIAL_QUEST_STAGE_ID, QuestStageDefinition> &
  Record<string, QuestStageDefinition>;

export interface QuestDefinition {
  name: string;
  description: string;
  category: QuestCategory;
  stages: QuestStageMap;
}

export type QuestDefinitionMap = Record<QuestId, QuestDefinition>;

export interface QuestServiceDefinition {
  label: string;
}

export type QuestServicesMap = Partial<Record<InteractionService, QuestServiceDefinition>>;
export type QuestServicesDatabase = Record<QuestId, QuestServicesMap>;

export type QuestNarrativesMap = Partial<Record<InteractionService, NarrativeOutcomeEntry>>;
export type QuestNarrativesDatabase = Record<QuestId, QuestNarrativesMap>;

export type { StatsSliceState } from './statsSlice.types';