import type { MainStatKey, SkillKey } from './character.types';
import type { NumericComparison } from './common.types';
import type { EnemyTypeId, FactionId, ItemId, NpcId, QuestId } from './ids.types';
import type { RegionParameterKey } from './region.types';

/**
 * Условия Actions и Interceptors.
 *
 * Один и тот же union используется для `conditions` и `requirements`;
 * различается только реакция на невыполнение:
 *
 * ```text
 * conditions   → Action скрыт, Interceptor не попадает в очередь
 * requirements → Action остаётся видимым, но disabled
 * ```
 *
 * Массивы условий объединяются через AND. Групп OR/NOT в первой версии нет.
 */
export type QuestVarValue = boolean | number | string;

/** Ссылка на переменную конкретного квеста. */
export interface QuestVarRef {
  questId: QuestId;
  key: string;
}

export type QuestStatus = 'initial' | 'active' | 'completed' | 'failed';

export interface StatCondition extends NumericComparison {
  type: 'stat';
  statId: MainStatKey;
}

export interface SkillCondition extends NumericComparison {
  type: 'skill';
  skillId: SkillKey;
}

export interface ItemCondition extends NumericComparison {
  type: 'item';
  itemId: ItemId;
}

/**
 * Число побеждённых врагов указанного типа.
 *
 * Без `baselineFromVar` проверяется общий накопительный счётчик. С ним
 * проверяется разница между текущим счётчиком и значением, сохранённым
 * эффектом `snapshotDefeatedCount`.
 */
export interface DefeatedCondition extends NumericComparison {
  type: 'defeated';
  enemyTypeId: EnemyTypeId;
  baselineFromVar?: QuestVarRef;
}

/**
 * Affection NPC.
 *
 * Без `npcId` условие адресует NPC текущего slot/NPC-контекста. Явный ID
 * переопределяет этот default. Неразрешимый текущий субъект является
 * ошибкой авторских данных, а не обычным `false`.
 */
export interface AffectionCondition extends NumericComparison {
  type: 'affection';
  npcId?: NpcId;
}

/**
 * Репутация игрока с фракцией.
 *
 * Без `factionId` условие адресует фракцию текущего субъекта: сначала
 * текущего NPC, затем текущего POI. У NPC фракция есть всегда, у POI может
 * отсутствовать. Явный ID переопределяет default.
 */
export interface ReputationCondition extends NumericComparison {
  type: 'reputation';
  factionId?: FactionId;
}

/** Число состоявшихся встреч с конкретным NPC. */
export interface TimesMetCondition extends NumericComparison {
  type: 'timesMet';
  npcId: NpcId;
}

/** Итоговый уровень `0..9` регионального параметра текущего POI. */
export interface RegionLevelCondition extends NumericComparison {
  type: 'regionLevel';
  param: RegionParameterKey;
}

interface QuestVarConditionBase {
  type: 'questVar';
  questId: QuestId;
  key: string;
}

/**
 * Сравнение квестовой переменной.
 *
 * `equals` и `notEquals` взаимоисключающие. Отсутствующая переменная остаётся
 * обычным `undefined` и не превращается в `false`, поэтому флаги не требуют
 * предварительной инициализации.
 */
export type QuestVarCondition =
  | (QuestVarConditionBase & { equals: QuestVarValue; notEquals?: never })
  | (QuestVarConditionBase & { notEquals: QuestVarValue; equals?: never });

export interface QuestStatusCondition {
  type: 'questStatus';
  questId: QuestId;
  status: QuestStatus;
}

export type ActionCondition =
  | StatCondition
  | SkillCondition
  | ItemCondition
  | DefeatedCondition
  | AffectionCondition
  | ReputationCondition
  | TimesMetCondition
  | RegionLevelCondition
  | QuestVarCondition
  | QuestStatusCondition;
