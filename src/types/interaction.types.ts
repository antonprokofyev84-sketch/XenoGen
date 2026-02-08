import type { MainStatKey, SkillKey } from './character.types';
import type { EffectLogs } from './effects.types';

export type ForceBehavior = 'forceLeave' | 'forceAttack' | 'forceRetreat';
export type InteractionService =
  | 'attack'
  | 'trade'
  | 'talk'
  | 'leave'
  | 'retreat'
  | 'testService'
  | 'mock';

export interface InteractionServiceState {
  id: InteractionService;
  executedTimes: number;
  maxExecutions?: number;
}

export interface InteractionServiceRule {
  autoSuccessRelation?: number;
  checkStat?: SkillKey | MainStatKey;
  onSuccess?: InteractionEffectDescriptor[];
  onFail?: InteractionEffectDescriptor[];
}

export type InteractionEffectDescriptor =
  | {
      type: 'modifyTension';
      delta: number;
    }
  | {
      type: 'modifyFactionReputation';
      delta: number;
    }
  | {
      type: 'modifyTargetAffection';
      delta: number;
    }
  | {
      type: 'modifySkill';
      skill: SkillKey;
      delta: number;
    }
  | {
      type: 'modifyMainStat';
      stat: MainStatKey;
      delta: number;
    };

export interface InteractionLogEvent {
  /** Какое действие пытался выполнить игрок */
  action: string; // 'talk', 'trade', 'attack'

  /** Напряжение на момент события */
  tension: number;

  /** Итог попытки (если применимо) */
  success?: boolean;

  /** Проверка, если была */
  roll?: {
    stat?: string; // 'Charisma'
    rollValue: number; // 12
    targetValue: number; // 15
    difference: number; // -3
  };

  /** Эффекты, которые реально произошли */
  effects?: EffectLogs;
}
