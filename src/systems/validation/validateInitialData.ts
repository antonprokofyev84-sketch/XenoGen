import { TIME_OF_DAY_IDS } from '@/constants';
import type {
  ActionCost,
  ActionOutcome,
  InitialAction,
  InitialActionMap,
} from '@/types/action.types';
import type { InitialCellList } from '@/types/cellContent.types';
import type { ActionCondition } from '@/types/condition.types';
import type { InitialFrame, InitialFrameMap } from '@/types/frame.types';
import type { Effect } from '@/types/gameEffect.types';
import { isQuestLifecycleEffect } from '@/types/gameEffect.types';
import type { InitialInterceptorMap } from '@/types/interceptor.types';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import { CURRENT_NPC_SPEAKER, isDialogueLine } from '@/types/narrativeBlock.types';
import type { InitialNpcMap } from '@/types/npcContent.types';
import type {
  InitialNpcSlot,
  InitialNpcSlots,
  InitialPoisByCell,
  PoiTemplateMap,
} from '@/types/poiContent.types';
import type { InitialQuestMap } from '@/types/questContent.types';
import { REGION_PARAMETER_KEYS } from '@/types/region.types';
import {
  REGION_LEVEL_MAX,
  REGION_LEVEL_MIN,
  REGION_RAW_MAX,
  REGION_RAW_MIN,
} from '@/types/region.types';

/**
 * Development-валидатор initial-данных.
 *
 * Работает только на этапе разработки и в тестах. Рантайм полагается на то,
 * что валидатор уже отсёк ошибки: он не дедуплицирует списки, не округляет
 * числа и не «чинит» данные молча.
 *
 * Валидатор ничего не исправляет — он только возвращает конкретные ошибки
 * с указанием пути. Контракт проверок описан в `docs/new/validation-contract.md`.
 */

export interface ValidationIssue {
  /** Путь к проблемному месту, например `INITIAL_ACTIONS.bob.ask.cost.items[0]`. */
  path: string;
  message: string;
}

/**
 * Реестры-справочники, существующие за пределами нового контракта.
 * Передаются множествами ID, чтобы валидатор не зависел от их формы.
 */
export interface ReferenceIdSets {
  itemIds: ReadonlySet<string>;
  factionIds: ReadonlySet<string>;
  enemyTypeIds: ReadonlySet<string>;
}

export interface InitialDataBundle {
  cells: InitialCellList;
  poisByCell: InitialPoisByCell;
  poiTemplates: PoiTemplateMap;
  npcs: InitialNpcMap;
  frames: InitialFrameMap;
  actions: InitialActionMap;
  interceptors: InitialInterceptorMap;
  quests: InitialQuestMap;
  references: ReferenceIdSets;
}

const CELL_ID_PATTERN = /^\d+-\d+$/;

// ============================================================
// Helpers
// ============================================================

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isProbability(value: number): boolean {
  return value >= 0 && value <= 1;
}

/** Собирает все `ActionOutcome` definition: прямой результат и обе ветки проверки. */
function collectOutcomes(definition: InitialAction): ActionOutcome[] {
  if (definition.check) {
    return [definition.check.onSuccess, definition.check.onFail];
  }

  return definition.result === undefined ? [] : [definition.result];
}

/** Разворачивает outcome в плоский список effects всех его вариантов. */
function collectEffectGroups(outcome: ActionOutcome): Effect[][] {
  if (Array.isArray(outcome)) {
    return outcome.map((weighted) => weighted.result.effects ?? []);
  }

  return [outcome.effects ?? []];
}

function collectNarratives(outcome: ActionOutcome): NarrativeBlock[][] {
  if (Array.isArray(outcome)) {
    return outcome.map((weighted) => weighted.result.narrative ?? []);
  }

  return [outcome.narrative ?? []];
}

// ============================================================
// 1. Frame ID grammar
// ============================================================

/**
 * Проверяет грамматику `templateId[/slotId][:framePath]`.
 *
 * `/` отделяет slot от template и допустим один раз до первого `:`.
 * `:` отделяет локальный Frame от контекста и может повторяться внутри пути.
 */
export function validateFrameId(frameId: string): string | undefined {
  if (frameId.length === 0) {
    return 'FrameId пустой';
  }

  const [contextId, ...pathSegments] = frameId.split(':');

  if (contextId.length === 0) {
    return 'FrameId начинается с ":": контекст не указан';
  }

  if (pathSegments.some((segment) => segment.length === 0)) {
    return 'FrameId содержит пустой сегмент framePath';
  }

  const slotSeparatorCount = contextId.split('/').length - 1;

  if (slotSeparatorCount > 1) {
    return 'FrameId содержит более одного "/"';
  }

  if (contextId.split('/').some((segment) => segment.length === 0)) {
    return 'FrameId содержит пустой templateId или slotId';
  }

  if (pathSegments.some((segment) => segment.includes('/'))) {
    return 'FrameId содержит "/" внутри framePath';
  }

  return undefined;
}

// ============================================================
// 2. Conditions
// ============================================================

function validateConditions(
  conditions: ActionCondition[] | undefined,
  path: string,
  bundle: InitialDataBundle,
  issues: ValidationIssue[],
): void {
  conditions?.forEach((condition, index) => {
    const conditionPath = `${path}[${index}]`;

    switch (condition.type) {
      case 'item':
        if (!bundle.references.itemIds.has(condition.itemId)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный itemId "${condition.itemId}"`,
          });
        }
        break;

      case 'defeated':
        if (!bundle.references.enemyTypeIds.has(condition.enemyTypeId)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный enemyTypeId "${condition.enemyTypeId}"`,
          });
        }
        if (condition.baselineFromVar && !(condition.baselineFromVar.questId in bundle.quests)) {
          issues.push({
            path: `${conditionPath}.baselineFromVar`,
            message: `Неизвестный questId "${condition.baselineFromVar.questId}"`,
          });
        }
        break;

      case 'affection':
        if (condition.npcId !== undefined && !(condition.npcId in bundle.npcs)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный npcId "${condition.npcId}"`,
          });
        }
        break;

      case 'timesMet':
        if (!(condition.npcId in bundle.npcs)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный npcId "${condition.npcId}"`,
          });
        }
        break;

      case 'reputation':
        if (
          condition.factionId !== undefined &&
          !bundle.references.factionIds.has(condition.factionId)
        ) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный factionId "${condition.factionId}"`,
          });
        }
        break;

      case 'regionLevel':
        if (!REGION_PARAMETER_KEYS.includes(condition.param)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный региональный параметр "${condition.param}"`,
          });
        }
        break;

      case 'questVar': {
        if (!(condition.questId in bundle.quests)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный questId "${condition.questId}"`,
          });
        }

        const hasEquals = condition.equals !== undefined;
        const hasNotEquals = condition.notEquals !== undefined;

        if (hasEquals === hasNotEquals) {
          issues.push({
            path: conditionPath,
            message: 'questVar требует ровно одно из "equals" или "notEquals"',
          });
        }
        break;
      }

      case 'questStatus':
        if (!(condition.questId in bundle.quests)) {
          issues.push({
            path: conditionPath,
            message: `Неизвестный questId "${condition.questId}"`,
          });
        }
        break;

      default:
        break;
    }
  });
}
// ============================================================
// 3. Effects
// ============================================================

function validateEffects(
  effects: Effect[] | undefined,
  path: string,
  bundle: InitialDataBundle,
  issues: ValidationIssue[],
): void {
  if (!effects) {
    return;
  }

  const lifecycleQuestIds = new Set<string>();

  effects.forEach((effect, index) => {
    const effectPath = `${path}[${index}]`;

    if (isQuestLifecycleEffect(effect)) {
      if (lifecycleQuestIds.has(effect.questId)) {
        issues.push({
          path: effectPath,
          message: `Несколько lifecycle-эффектов квеста "${effect.questId}" в одном блоке effects`,
        });
      }
      lifecycleQuestIds.add(effect.questId);
    }

    switch (effect.type) {
      case 'setQuestStage': {
        const quest = bundle.quests[effect.questId];

        if (!quest) {
          issues.push({ path: effectPath, message: `Неизвестный questId "${effect.questId}"` });
        } else if (!(effect.stageId in quest.stages)) {
          issues.push({
            path: effectPath,
            message: `Квест "${effect.questId}" не содержит стадию "${effect.stageId}"`,
          });
        }
        break;
      }

      case 'setQuestVar':
      case 'setQuestJournalVisibility':
      case 'completeQuest':
      case 'failQuest':
        if (!(effect.questId in bundle.quests)) {
          issues.push({ path: effectPath, message: `Неизвестный questId "${effect.questId}"` });
        }
        break;

      case 'snapshotDefeatedCount':
        if (!(effect.questId in bundle.quests)) {
          issues.push({ path: effectPath, message: `Неизвестный questId "${effect.questId}"` });
        }
        if (!bundle.references.enemyTypeIds.has(effect.enemyTypeId)) {
          issues.push({
            path: effectPath,
            message: `Неизвестный enemyTypeId "${effect.enemyTypeId}"`,
          });
        }
        break;

      case 'addItem':
      case 'removeItem':
        if (!bundle.references.itemIds.has(effect.itemId)) {
          issues.push({ path: effectPath, message: `Неизвестный itemId "${effect.itemId}"` });
        }
        break;

      case 'disablePoiEntryForDays':
        if (!isPositiveInteger(effect.days)) {
          issues.push({
            path: effectPath,
            message: `"days" должен быть положительным целым, получено ${effect.days}`,
          });
        }
        break;

      case 'changeRegionParameter':
        if (!REGION_PARAMETER_KEYS.includes(effect.cellParam)) {
          issues.push({
            path: effectPath,
            message: `Неизвестный региональный параметр "${effect.cellParam}"`,
          });
        }
        if (effect.chance !== undefined && !isProbability(effect.chance)) {
          issues.push({
            path: effectPath,
            message: `"chance" должен быть в диапазоне 0..1, получено ${effect.chance}`,
          });
        }
        break;

      default:
        break;
    }
  });
}

// ============================================================
// 4. Narrative
// ============================================================

function validateNarrative(
  blocks: NarrativeBlock[],
  path: string,
  issues: ValidationIssue[],
): void {
  blocks.forEach((block, index) => {
    if (isDialogueLine(block) && block.speakerId.length === 0) {
      issues.push({ path: `${path}[${index}]`, message: 'Пустой speakerId' });
    }
  });
}

// ============================================================
// 5. Actions
// ============================================================

function validateActionCost(
  cost: ActionCost | undefined,
  path: string,
  bundle: InitialDataBundle,
  issues: ValidationIssue[],
): void {
  cost?.items?.forEach((item, index) => {
    if (!bundle.references.itemIds.has(item.itemId)) {
      issues.push({
        path: `${path}.items[${index}]`,
        message: `Неизвестный itemId "${item.itemId}"`,
      });
    }
  });
}

function validateActions(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [actionId, definition] of Object.entries(bundle.actions)) {
    const path = `INITIAL_ACTIONS.${actionId}`;

    const hasResult = definition.result !== undefined;
    const hasCheck = definition.check !== undefined;

    if (hasResult === hasCheck) {
      issues.push({ path, message: 'Action должен содержать ровно одно из "result" или "check"' });
    }

    if (definition.label.length === 0) {
      issues.push({ path, message: 'Пустой label' });
    }

    if (
      typeof definition.appearanceChance === 'number' &&
      !isProbability(definition.appearanceChance)
    ) {
      issues.push({
        path: `${path}.appearanceChance`,
        message: `Должен быть в диапазоне 0..1, получено ${definition.appearanceChance}`,
      });
    }

    if (definition.check?.type === 'chance' && typeof definition.check.chance === 'number') {
      if (!isProbability(definition.check.chance)) {
        issues.push({
          path: `${path}.check.chance`,
          message: `Должен быть в диапазоне 0..1, получено ${definition.check.chance}`,
        });
      }
    }

    const { perDay, total } = definition.executionLimit ?? {};

    if (perDay !== undefined && !isPositiveInteger(perDay)) {
      issues.push({
        path: `${path}.executionLimit.perDay`,
        message: `Должен быть положительным целым, получено ${perDay}`,
      });
    }

    if (total !== undefined && !isPositiveInteger(total)) {
      issues.push({
        path: `${path}.executionLimit.total`,
        message: `Должен быть положительным целым, получено ${total}`,
      });
    }

    validateConditions(definition.conditions, `${path}.conditions`, bundle, issues);
    validateConditions(definition.requirements, `${path}.requirements`, bundle, issues);
    validateActionCost(definition.cost, `${path}.cost`, bundle, issues);

    collectOutcomes(definition).forEach((outcome, outcomeIndex) => {
      const outcomePath = hasCheck
        ? `${path}.check.${outcomeIndex === 0 ? 'onSuccess' : 'onFail'}`
        : `${path}.result`;

      if (Array.isArray(outcome)) {
        if (outcome.length === 0) {
          issues.push({ path: outcomePath, message: 'Пустой массив взвешенных результатов' });
        }

        const staticWeights = outcome
          .map((weighted) => weighted.weight)
          .filter((weight): weight is number => typeof weight === 'number');

        if (staticWeights.some((weight) => weight < 0)) {
          issues.push({ path: outcomePath, message: 'Веса не могут быть отрицательными' });
        }

        if (
          staticWeights.length === outcome.length &&
          staticWeights.reduce((sum, weight) => sum + weight, 0) <= 0
        ) {
          issues.push({ path: outcomePath, message: 'Суммарный вес должен быть положительным' });
        }
      }

      collectEffectGroups(outcome).forEach((effects, groupIndex) => {
        validateEffects(effects, `${outcomePath}[${groupIndex}].effects`, bundle, issues);
      });

      collectNarratives(outcome).forEach((blocks, groupIndex) => {
        validateNarrative(blocks, `${outcomePath}[${groupIndex}].narrative`, issues);
      });

      const transitions = Array.isArray(outcome)
        ? outcome.map((weighted) => weighted.result.transition)
        : [outcome.transition];

      transitions.forEach((transition, transitionIndex) => {
        if (transition?.type === 'frame' && !(transition.frameId in bundle.frames)) {
          issues.push({
            path: `${outcomePath}[${transitionIndex}].transition`,
            message: `Неизвестный frameId "${transition.frameId}"`,
          });
        }
      });
    });
  }
}
// ============================================================
// 6. Interceptors
// ============================================================

function validateInterceptors(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [interceptorId, definition] of Object.entries(bundle.interceptors)) {
    const path = `INITIAL_INTERCEPTORS.${interceptorId}`;

    const hasResult = definition.result !== undefined;
    const hasCheck = definition.check !== undefined;

    if (hasResult === hasCheck) {
      issues.push({
        path,
        message: 'Interceptor должен содержать ровно одно из "result" или "check"',
      });
    }

    if (
      typeof definition.appearanceChance === 'number' &&
      !isProbability(definition.appearanceChance)
    ) {
      issues.push({
        path: `${path}.appearanceChance`,
        message: `Должен быть в диапазоне 0..1, получено ${definition.appearanceChance}`,
      });
    }

    validateConditions(definition.conditions, `${path}.conditions`, bundle, issues);

    const results = definition.check
      ? [definition.check.onSuccess, definition.check.onFail]
      : definition.result === undefined
        ? []
        : [definition.result];

    results.forEach((result, index) => {
      const resultPath = definition.check
        ? `${path}.check.${index === 0 ? 'onSuccess' : 'onFail'}`
        : `${path}.result`;

      validateEffects(result.effects, `${resultPath}.effects`, bundle, issues);
      validateNarrative(result.narrative ?? [], `${resultPath}.narrative`, issues);

      if (result.transition && !(result.transition.frameId in bundle.frames)) {
        issues.push({
          path: `${resultPath}.transition`,
          message: `Неизвестный frameId "${result.transition.frameId}"`,
        });
      }
    });
  }
}

// ============================================================
// 7. Frames
// ============================================================

function validateFrames(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [frameId, frame] of Object.entries<InitialFrame>(bundle.frames)) {
    const path = `INITIAL_FRAMES.${frameId}`;
    const grammarError = validateFrameId(frameId);

    if (grammarError) {
      issues.push({ path, message: grammarError });
    }

    frame.actionIds?.forEach((actionId, index) => {
      if (!(actionId in bundle.actions)) {
        issues.push({
          path: `${path}.actionIds[${index}]`,
          message: `Неизвестный actionId "${actionId}"`,
        });
      }
    });

    validateNarrative(frame.narrative ?? [], `${path}.narrative`, issues);

    const usesCurrentNpc =
      frame.npcDisplay === 'always' ||
      (frame.narrative ?? []).some(
        (block) => isDialogueLine(block) && block.speakerId === CURRENT_NPC_SPEAKER,
      );

    // NPC текущего контекста существует только у slot root и его Frames.
    if (usesCurrentNpc && !frameId.includes('/')) {
      issues.push({
        path,
        message:
          'Frame использует NPC текущего контекста ($npc либо npcDisplay: "always"), ' +
          'но его ID не относится к slot/NPC-контексту',
      });
    }
  }
}

// ============================================================
// 8. Quests
// ============================================================

function validateQuests(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [questId, quest] of Object.entries(bundle.quests)) {
    const path = `INITIAL_QUESTS.${questId}`;

    if (!('initialStage' in quest.stages)) {
      issues.push({ path, message: 'Квест не содержит стадию "initialStage"' });
    }

    if (quest.timeLimit) {
      if (!isPositiveInteger(quest.timeLimit.days)) {
        issues.push({
          path: `${path}.timeLimit.days`,
          message: `Должен быть положительным целым, получено ${quest.timeLimit.days}`,
        });
      }
      validateEffects(quest.timeLimit.onExpire, `${path}.timeLimit.onExpire`, bundle, issues);
    }

    for (const [stageId, stage] of Object.entries(quest.stages)) {
      const stagePath = `${path}.stages.${stageId}`;

      if (stage.timeLimit) {
        if (!isPositiveInteger(stage.timeLimit.days)) {
          issues.push({
            path: `${stagePath}.timeLimit.days`,
            message: `Должен быть положительным целым, получено ${stage.timeLimit.days}`,
          });
        }
        validateEffects(
          stage.timeLimit.onExpire,
          `${stagePath}.timeLimit.onExpire`,
          bundle,
          issues,
        );
      }

      const knownTargets = new Set([
        ...Object.keys(bundle.npcs),
        ...Object.values(bundle.poisByCell)
          .flat()
          .map((poi) => poi?.id)
          .filter((id): id is string => id !== undefined),
      ]);

      for (const [targetId, actionIds] of Object.entries(stage.actionIdsByTarget ?? {})) {
        if (!knownTargets.has(targetId)) {
          issues.push({
            path: `${stagePath}.actionIdsByTarget`,
            message: `Неизвестный QuestTargetId "${targetId}"`,
          });
        }

        actionIds?.forEach((actionId) => {
          if (!(actionId in bundle.actions)) {
            issues.push({
              path: `${stagePath}.actionIdsByTarget.${targetId}`,
              message: `Неизвестный actionId "${actionId}"`,
            });
          }
        });
      }

      for (const [targetId, interceptorIds] of Object.entries(stage.interceptorIdsByTarget ?? {})) {
        if (!knownTargets.has(targetId)) {
          issues.push({
            path: `${stagePath}.interceptorIdsByTarget`,
            message: `Неизвестный QuestTargetId "${targetId}"`,
          });
        }

        interceptorIds?.forEach((interceptorId) => {
          if (!(interceptorId in bundle.interceptors)) {
            issues.push({
              path: `${stagePath}.interceptorIdsByTarget.${targetId}`,
              message: `Неизвестный interceptorId "${interceptorId}"`,
            });
          }
        });
      }
    }
  }
}

// ============================================================
// 9. Cells
// ============================================================

function validateCells(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  const seenIds = new Set<string>();

  bundle.cells.forEach((cell, index) => {
    const path = `INITIAL_CELLS[${index}]`;

    if (!CELL_ID_PATTERN.test(cell.id)) {
      issues.push({
        path,
        message: `CellId "${cell.id}" не соответствует формату "{col}-{row}"`,
      });
    }

    if (seenIds.has(cell.id)) {
      issues.push({ path, message: `Дублирующийся CellId "${cell.id}"` });
    }
    seenIds.add(cell.id);

    for (const key of REGION_PARAMETER_KEYS) {
      const value = cell.details.regionParameters[key];

      if (value === undefined) {
        issues.push({
          path: `${path}.details.regionParameters`,
          message: `Отсутствует региональный параметр "${key}"`,
        });
        continue;
      }

      if (value < REGION_RAW_MIN || value > REGION_RAW_MAX) {
        issues.push({
          path: `${path}.details.regionParameters.${key}`,
          message: `Должен быть в диапазоне ${REGION_RAW_MIN}..${REGION_RAW_MAX}, получено ${value}`,
        });
      }
    }

    const { explorationDaysLeft } = cell.details;

    if (
      explorationDaysLeft !== undefined &&
      explorationDaysLeft !== null &&
      !isNonNegativeInteger(explorationDaysLeft)
    ) {
      issues.push({
        path: `${path}.details.explorationDaysLeft`,
        message: `Должен быть null либо неотрицательным целым, получено ${explorationDaysLeft}`,
      });
    }
  });
}

// ============================================================
// 10. POI placement and templates
// ============================================================

function validatePois(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  const cellIds = new Set(bundle.cells.map((cell) => cell.id));
  const poiIds = new Set<string>();

  for (const pois of Object.values(bundle.poisByCell)) {
    for (const poi of pois ?? []) {
      if (poiIds.has(poi.id)) {
        issues.push({ path: `INITIAL_POIS_BY_CELL.${poi.id}`, message: 'Дублирующийся PoiId' });
      }
      poiIds.add(poi.id);
    }
  }

  for (const [cellId, pois] of Object.entries(bundle.poisByCell)) {
    if (!cellIds.has(cellId)) {
      issues.push({
        path: `INITIAL_POIS_BY_CELL.${cellId}`,
        message: 'Группа ссылается на несуществующую клетку',
      });
    }

    (pois ?? []).forEach((poi) => {
      const path = `INITIAL_POIS_BY_CELL.${cellId}.${poi.id}`;

      if (!(poi.templateId in bundle.poiTemplates)) {
        issues.push({ path, message: `Неизвестный templateId "${poi.templateId}"` });
      }

      if (!cellIds.has(poi.parentId) && !poiIds.has(poi.parentId)) {
        issues.push({ path, message: `Неизвестный parentId "${poi.parentId}"` });
      }

      const { lifetimeDaysLeft, entryDisabledDaysLeft, faction } = poi.details;

      if (
        lifetimeDaysLeft !== undefined &&
        lifetimeDaysLeft !== null &&
        !isPositiveInteger(lifetimeDaysLeft)
      ) {
        issues.push({
          path: `${path}.details.lifetimeDaysLeft`,
          message: `Должен быть null либо положительным целым, получено ${lifetimeDaysLeft}`,
        });
      }

      if (entryDisabledDaysLeft !== undefined && !isPositiveInteger(entryDisabledDaysLeft)) {
        issues.push({
          path: `${path}.details.entryDisabledDaysLeft`,
          message: `Должен быть положительным целым, получено ${entryDisabledDaysLeft}`,
        });
      }

      if (faction !== undefined && !bundle.references.factionIds.has(faction)) {
        issues.push({
          path: `${path}.details.faction`,
          message: `Неизвестная фракция "${faction}"`,
        });
      }
    });
  }

  validatePoiTemplates(bundle, issues);
}

function validatePoiTemplates(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [templateId, template] of Object.entries(bundle.poiTemplates)) {
    const path = `POI_TEMPLATES.${templateId}`;

    if (template.schedule) {
      for (const timeOfDay of TIME_OF_DAY_IDS) {
        if (!(timeOfDay in template.schedule)) {
          issues.push({
            path: `${path}.schedule`,
            message: `Отсутствует time slot "${timeOfDay}"`,
          });
        }
      }
    }

    template.actionIds?.forEach((actionId) => {
      if (!(actionId in bundle.actions)) {
        issues.push({ path: `${path}.actionIds`, message: `Неизвестный actionId "${actionId}"` });
      }
    });

    template.interceptorIds?.forEach((interceptorId) => {
      if (!(interceptorId in bundle.interceptors)) {
        issues.push({
          path: `${path}.interceptorIds`,
          message: `Неизвестный interceptorId "${interceptorId}"`,
        });
      }
    });

    for (const [key, level] of Object.entries(template.regionLevelOverrides ?? {})) {
      if (!Number.isInteger(level) || level < REGION_LEVEL_MIN || level > REGION_LEVEL_MAX) {
        issues.push({
          path: `${path}.regionLevelOverrides.${key}`,
          message: `Override должен быть целым ${REGION_LEVEL_MIN}..${REGION_LEVEL_MAX}, получено ${level}`,
        });
      }
    }

    for (const [key, delta] of Object.entries(template.regionLevelModifiers ?? {})) {
      if (!Number.isInteger(delta)) {
        issues.push({
          path: `${path}.regionLevelModifiers.${key}`,
          message: `Modifier должен быть целой дельтой уровня, получено ${delta}`,
        });
      }
    }

    validateEffects(template.onDayPass, `${path}.onDayPass`, bundle, issues);
    validateTemplateSlots(bundle, templateId, issues);
  }

  validateWorkSlotCandidates(bundle, issues);
}

/**
 * Авторский кандидат допускается максимум в одном work slot мира.
 *
 * Глобальный resolved schedule резервирует работающего NPC за конкретным
 * рабочим местом, поэтому вторая работа сделала бы выбор зависимым от порядка
 * обхода данных. Персональные назначения игрока этим правилом не ограничены:
 * они перекрывают авторское членство.
 */
function validateWorkSlotCandidates(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  const workSlotPathByNpcId = new Map<string, string>();

  for (const [templateId, template] of Object.entries(bundle.poiTemplates)) {
    for (const slot of template.npcSlots?.work ?? []) {
      const path = `POI_TEMPLATES.${templateId}.npcSlots.work.${slot.id}`;

      for (const npcId of slot.candidateNpcIds) {
        const existingPath = workSlotPathByNpcId.get(npcId);

        if (existingPath !== undefined) {
          issues.push({
            path: `${path}.candidateNpcIds`,
            message: `NPC "${npcId}" уже является кандидатом work slot "${existingPath}"`,
          });
          continue;
        }

        workSlotPathByNpcId.set(npcId, path);
      }
    }
  }
}
/** Раскрывает группы slots в явный список пар, сохраняя типизацию элементов. */
function listSlotGroups(
  npcSlots: InitialNpcSlots | undefined,
): readonly (readonly [string, readonly InitialNpcSlot[]])[] {
  if (!npcSlots) {
    return [];
  }

  return [
    ['work', npcSlots.work ?? []] as const,
    ['freeTime', npcSlots.freeTime ?? []] as const,
    ['home', npcSlots.home ?? []] as const,
  ];
}

function validateTemplateSlots(
  bundle: InitialDataBundle,
  templateId: string,
  issues: ValidationIssue[],
): void {
  const template = bundle.poiTemplates[templateId];
  const seenSlotIds = new Set<string>();

  for (const [groupName, slots] of listSlotGroups(template.npcSlots)) {
    slots.forEach((slot) => {
      const path = `POI_TEMPLATES.${templateId}.npcSlots.${groupName}.${slot.id}`;

      if (seenSlotIds.has(slot.id)) {
        issues.push({ path, message: `Дублирующийся SlotId "${slot.id}" внутри template` });
      }
      seenSlotIds.add(slot.id);

      if (slot.chance !== undefined && !isProbability(slot.chance)) {
        issues.push({
          path: `${path}.chance`,
          message: `Должен быть в диапазоне 0..1, получено ${slot.chance}`,
        });
      }

      slot.candidateNpcIds.forEach((npcId) => {
        if (!(npcId in bundle.npcs)) {
          issues.push({
            path: `${path}.candidateNpcIds`,
            message: `Неизвестный npcId "${npcId}"`,
          });
        }
      });

      slot.actionIds?.forEach((actionId) => {
        if (!(actionId in bundle.actions)) {
          issues.push({ path: `${path}.actionIds`, message: `Неизвестный actionId "${actionId}"` });
        }
      });

      slot.interceptorIds?.forEach((interceptorId) => {
        if (!(interceptorId in bundle.interceptors)) {
          issues.push({
            path: `${path}.interceptorIds`,
            message: `Неизвестный interceptorId "${interceptorId}"`,
          });
        }
      });
    });
  }
}

// ============================================================
// 11. NPCs
// ============================================================

function validateNpcs(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  for (const [npcId, npc] of Object.entries(bundle.npcs)) {
    const path = `INITIAL_NPCS.${npcId}`;

    if (!bundle.references.factionIds.has(npc.faction)) {
      issues.push({ path: `${path}.faction`, message: `Неизвестная фракция "${npc.faction}"` });
    }

    for (const timeOfDay of TIME_OF_DAY_IDS) {
      if (!(timeOfDay in npc.baseSchedule)) {
        issues.push({
          path: `${path}.baseSchedule`,
          message: `Отсутствует time slot "${timeOfDay}"`,
        });
      }
    }

    npc.actionIds?.forEach((actionId) => {
      if (!(actionId in bundle.actions)) {
        issues.push({ path: `${path}.actionIds`, message: `Неизвестный actionId "${actionId}"` });
      }
    });

    npc.interceptorIds?.forEach((interceptorId) => {
      if (!(interceptorId in bundle.interceptors)) {
        issues.push({
          path: `${path}.interceptorIds`,
          message: `Неизвестный interceptorId "${interceptorId}"`,
        });
      }
    });
  }
}

// ============================================================
// 12. Source uniqueness
// ============================================================

/**
 * Один `InterceptorId` не должен приходить в **один контекст** из нескольких
 * источников; рантайм очередь не дедуплицирует.
 *
 * Контексты и их источники:
 *
 * ```text
 * POI      → template.interceptorIds + quest interceptorIdsByTarget[poiId]
 * slot/NPC → slot.interceptorIds + npc.interceptorIds + quest[...][npcId]
 * ```
 *
 * Один и тот же Interceptor, использованный разными POI или разными NPC,
 * нарушением не является: это разные контексты.
 */
function validateSourceUniqueness(bundle: InitialDataBundle, issues: ValidationIssue[]): void {
  const questInterceptorsByTarget = collectQuestInterceptorsByTarget(bundle);

  const reportDuplicates = (contextLabel: string, sourcesById: Map<string, string[]>): void => {
    for (const [interceptorId, sources] of sourcesById) {
      if (sources.length > 1) {
        issues.push({
          path: contextLabel,
          message: `Interceptor "${interceptorId}" приходит из нескольких источников: ${sources.join(', ')}`,
        });
      }
    }
  };

  const register = (map: Map<string, string[]>, id: string, source: string): void => {
    const existing = map.get(id);

    if (existing) {
      existing.push(source);
    } else {
      map.set(id, [source]);
    }
  };

  for (const pois of Object.values(bundle.poisByCell)) {
    for (const poi of pois ?? []) {
      const template = bundle.poiTemplates[poi.templateId];

      if (!template) {
        continue;
      }

      // POI-контекст.
      const poiSources = new Map<string, string[]>();

      template.interceptorIds?.forEach((id) =>
        register(poiSources, id, `POI_TEMPLATES.${poi.templateId}.interceptorIds`),
      );
      (questInterceptorsByTarget.get(poi.id) ?? []).forEach(({ id, source }) =>
        register(poiSources, id, source),
      );

      reportDuplicates(`POI-контекст "${poi.id}"`, poiSources);

      // slot/NPC-контексты: любой кандидат может занять slot.
      for (const [, slots] of listSlotGroups(template.npcSlots)) {
        for (const slot of slots) {
          for (const npcId of slot.candidateNpcIds) {
            const slotSources = new Map<string, string[]>();

            slot.interceptorIds?.forEach((id) =>
              register(
                slotSources,
                id,
                `POI_TEMPLATES.${poi.templateId}.npcSlots.${slot.id}.interceptorIds`,
              ),
            );
            bundle.npcs[npcId]?.interceptorIds?.forEach((id) =>
              register(slotSources, id, `INITIAL_NPCS.${npcId}.interceptorIds`),
            );
            (questInterceptorsByTarget.get(npcId) ?? []).forEach(({ id, source }) =>
              register(slotSources, id, source),
            );

            reportDuplicates(
              `slot-контекст "${poi.id}/${slot.id}" @ occupant "${npcId}"`,
              slotSources,
            );
          }
        }
      }
    }
  }
}

interface QuestInterceptorRef {
  id: string;
  source: string;
}

/** Строит индекс `QuestTargetId → квестовые Interceptors` по всем стадиям. */
function collectQuestInterceptorsByTarget(
  bundle: InitialDataBundle,
): Map<string, QuestInterceptorRef[]> {
  const byTarget = new Map<string, QuestInterceptorRef[]>();

  for (const [questId, quest] of Object.entries(bundle.quests)) {
    for (const [stageId, stage] of Object.entries(quest.stages)) {
      for (const [targetId, ids] of Object.entries(stage.interceptorIdsByTarget ?? {})) {
        for (const id of ids ?? []) {
          const source = `INITIAL_QUESTS.${questId}.stages.${stageId}.interceptorIdsByTarget.${targetId}`;
          const existing = byTarget.get(targetId);

          if (existing) {
            existing.push({ id, source });
          } else {
            byTarget.set(targetId, [{ id, source }]);
          }
        }
      }
    }
  }

  return byTarget;
}

// ============================================================
// Entry points
// ============================================================

/** Возвращает все найденные ошибки авторских данных. Пустой массив означает успех. */
export function validateInitialData(bundle: InitialDataBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  validateCells(bundle, issues);
  validatePois(bundle, issues);
  validateNpcs(bundle, issues);
  validateFrames(bundle, issues);
  validateActions(bundle, issues);
  validateInterceptors(bundle, issues);
  validateQuests(bundle, issues);
  validateSourceUniqueness(bundle, issues);

  return issues;
}

export function formatValidationIssues(issues: readonly ValidationIssue[]): string {
  return issues.map((issue) => `  ${issue.path}: ${issue.message}`).join('\n');
}

/** Бросает исключение с перечислением всех ошибок, если данные некорректны. */
export function assertValidInitialData(bundle: InitialDataBundle): void {
  const issues = validateInitialData(bundle);

  if (issues.length > 0) {
    throw new Error(
      `Initial data validation failed (${issues.length}):\n${formatValidationIssues(issues)}`,
    );
  }
}
