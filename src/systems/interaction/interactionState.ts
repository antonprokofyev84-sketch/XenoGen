import { INITIAL_FRAMES } from '@/data/initial/frames';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { npcDraft } from '@/state/gameSlices/npc';
import type { StoreState } from '@/state/useGameState';
import { applyEffects } from '@/systems/effects/applyEffects';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import type { FrameId, InterceptorId } from '@/types/ids.types';
import type {
  CurrentInteraction,
  InteractionContextIds,
  PendingInteractionEvent,
} from '@/types/interactionRuntime.types';
import { isNpcContext, resolveSubjectKey } from '@/types/interactionRuntime.types';
import type { InitialInterceptor, InterceptorResult } from '@/types/interceptor.types';
import { DEFAULT_INTERCEPTOR_PRIORITY } from '@/types/interceptor.types';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { findSlotDefinition, rollVisibleAppearanceChances } from './actionSources';
import { evaluateConditions } from './conditions';
import {
  FORCE_EXIT_TENSION_THRESHOLD,
  countExecution,
  ensureNpcDailyTension,
  isExecutionLimitReached,
  resolveAppearance,
} from './dailyMemory';
import { resolveForceExitFrameId, resolveRootFrameId } from './frameIds';
import { resolveNarrativeSnapshot } from './narrativeSnapshots';
import { runCheck } from './outcomes';

/**
 * Ядро runtime взаимодействия: контексты, Frames, лог и очередь событий входа.
 *
 * Все операции работают на draft внутри чужой транзакции, поэтому вложенного
 * `set` здесь нет.
 */

// ================================================================
// Лог и Frames
// ================================================================

export function appendLog(state: StoreState, blocks: readonly NarrativeBlock[] | undefined): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || !blocks || blocks.length === 0) return;

  // В лог попадают уже разрешённые blocks, поэтому последующая смена
  // occupancy, роли или знакомства старый текст не меняет.
  interaction.log.push({ blocks: resolveNarrativeSnapshot(state, blocks, interaction) });
}

/**
 * Открывает Frame: меняет активный ID, наследует или заменяет фон и
 * добавляет в лог его narrative.
 */
export function openFrame(state: StoreState, frameId: FrameId): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  const frame = INITIAL_FRAMES[frameId];
  interaction.activeFrameId = frameId;

  if (!frame) {
    console.warn(`openFrame: неизвестный Frame "${frameId}"`);
    return;
  }

  // Отсутствие собственного фона означает «не менять текущий».
  if (frame.background !== undefined) {
    interaction.currentBackground = frame.background;
  }

  appendLog(state, frame.narrative);
}

export function isAtRoot(state: StoreState): boolean {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return false;

  return interaction.activeFrameId === resolveRootFrameId(state, interaction);
}

export { resolveRootFrameId };

// ================================================================
// Источники Interceptors
// ================================================================

export function listInterceptorIds(
  state: StoreState,
  context: InteractionContextIds,
): InterceptorId[] {
  const poi = state.poiSlice.pois[context.poiId];
  if (!poi || !isNonCellNode(poi)) return [];

  if (!isNpcContext(context)) {
    return [
      ...(POI_TEMPLATES[poi.templateId]?.interceptorIds ?? []),
      ...(state.questSlice.questInterceptorIdsByTarget[context.poiId] ?? []),
    ];
  }

  const slot = findSlotDefinition(state, context.poiId, context.slotId);

  return [
    ...(slot?.interceptorIds ?? []),
    ...(INITIAL_NPCS[context.npcId]?.interceptorIds ?? []),
    ...(state.questSlice.questInterceptorIdsByTarget[context.npcId] ?? []),
  ];
}

// ================================================================
// Сборка очереди
// ================================================================

/**
 * Собирает authored-очередь текущего контекста.
 *
 * Снимок делает цепочку конечной: Interceptors, ставшие активными уже
 * после сборки, попадут в следующий вход либо в пересборку после смены time
 * slot.
 *
 * Массив сортируется по возрастанию приоритета, потому что очередь
 * разбирается с конца.
 */
export function collectInterceptorQueue(state: StoreState, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  const subjectKey = resolveSubjectKey(interaction);
  const context = buildActionContext(state, interaction, interaction.activeFrameId);

  const candidates: { interceptorId: InterceptorId; priority: number }[] = [];

  for (const interceptorId of listInterceptorIds(state, interaction)) {
    const interceptor = INITIAL_INTERCEPTORS[interceptorId];
    if (!interceptor) continue;

    if (
      isExecutionLimitReached(
        state,
        subjectKey,
        'interceptors',
        interceptorId,
        interceptor.executionLimit,
      )
    ) {
      continue;
    }

    if (!evaluateConditions(state, interceptor.conditions, context)) continue;

    if (
      !resolveAppearance(
        state,
        subjectKey,
        'interceptors',
        interceptorId,
        interceptor.appearanceChance,
        context,
        rng,
      )
    ) {
      continue;
    }

    candidates.push({
      interceptorId,
      priority: interceptor.priority ?? DEFAULT_INTERCEPTOR_PRIORITY,
    });
  }

  candidates.sort((left, right) =>
    left.priority !== right.priority
      ? left.priority - right.priority
      : right.interceptorId.localeCompare(left.interceptorId),
  );

  interaction.pendingEvents = candidates.map(({ interceptorId }) => ({
    type: 'interceptor',
    interceptorId,
  }));
}

/**
 * Идемпотентно планирует system `forceExit`.
 *
 * Он не проходит авторские проверки, очищает остаток authored-очереди и
 * существует только в slot/NPC-контексте.
 */
export function scheduleForceExit(state: StoreState): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || !isNpcContext(interaction)) return;

  const alreadyScheduled = interaction.pendingEvents.some((event) => event.type === 'forceExit');
  if (alreadyScheduled) return;

  interaction.pendingEvents = [{ type: 'forceExit' }];
}

/** Дневной tension на пороге или выше планирует принудительный выход. */
export function scheduleForceExitIfTense(state: StoreState, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || !isNpcContext(interaction)) return;

  if (ensureNpcDailyTension(state, interaction.npcId, rng) >= FORCE_EXIT_TENSION_THRESHOLD) {
    scheduleForceExit(state);
  }
}

// ================================================================
// Исполнение очереди
// ================================================================

function applyInterceptorResult(
  state: StoreState,
  result: InterceptorResult,
  context: InteractionContextIds,
): boolean {
  applyEffects(state, result.effects, { poiId: context.poiId, npcId: context.npcId });
  appendLog(state, result.narrative);

  if (!result.transition) return false;

  openFrame(state, result.transition.frameId);
  return true;
}

function executeInterceptor(
  state: StoreState,
  interceptorId: InterceptorId,
  interceptor: InitialInterceptor,
  rng: Rng,
): boolean {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return false;

  const subjectKey = resolveSubjectKey(interaction);
  const context = buildActionContext(state, interaction, interaction.activeFrameId);
  const contextIds: InteractionContextIds = { ...interaction };

  // Фактический запуск засчитывается, включая провал его `check`.
  countExecution(state, subjectKey, 'interceptors', interceptorId, interceptor.executionLimit);

  if (interceptor.check) {
    const isSuccess = runCheck(state, interceptor.check, context, rng);
    const branch = isSuccess ? interceptor.check.onSuccess : interceptor.check.onFail;

    return applyInterceptorResult(state, branch, contextIds);
  }

  return applyInterceptorResult(state, interceptor.result, contextIds);
}

/**
 * Разбирает очередь до первого Frame.
 *
 * Элемент извлекается **до** исполнения и в этот же момент проходит повторную
 * проверку условий: устаревший item молча отбрасывается. Silent Interceptor
 * очередь не приостанавливает.
 */
export function processPendingEvents(state: StoreState, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  // Сравнение по идентичности, а не по наличию: смена контекста заменяет объект
  // целиком, и очередь покинутого контекста разбирать нельзя. Выход обнуляет
  // ссылку и останавливает цикл тем же условием.
  while (
    state.interactionSlice.currentInteraction === interaction &&
    interaction.pendingEvents.length > 0
  ) {
    const event: PendingInteractionEvent | undefined = interaction.pendingEvents.pop();
    if (!event) return;

    if (event.type === 'forceExit') {
      executeForceExit(state);
      return;
    }

    const interceptor = INITIAL_INTERCEPTORS[event.interceptorId];
    if (!interceptor) continue;

    const context = buildActionContext(state, interaction, interaction.activeFrameId);
    if (!evaluateConditions(state, interceptor.conditions, context)) continue;

    if (executeInterceptor(state, event.interceptorId, interceptor, rng)) return;
  }
}

/**
 * Исполняет system `forceExit` в root slot/NPC-контекста.
 *
 * Авторский Frame задаёт более сильный исход; при его отсутствии контекст
 * тихо возвращается в текущий POI.
 */
export function executeForceExit(state: StoreState): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || !isNpcContext(interaction)) return;

  const forceExitFrameId = resolveForceExitFrameId(state, interaction);

  if (forceExitFrameId !== undefined && INITIAL_FRAMES[forceExitFrameId]) {
    openFrame(state, forceExitFrameId);
    return;
  }

  enterPoiContext(state, interaction.poiId);
}

// ================================================================
// Входы и переключение контекста
// ================================================================

export function endInteraction(state: StoreState): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (interaction && isNpcContext(interaction)) {
    npcDraft.registerNpcMeeting(state, interaction.npcId);
  }

  state.interactionSlice.currentInteraction = null;
  state.interactionSlice.isTrading = false;
}

/**
 * Начинает новый вход.
 *
 * Вход — одна runtime-операция: очередь событий разрешается до того, как UI
 * что-либо покажет, поэтому root не мелькает перед событием.
 */
function enterContext(
  state: StoreState,
  context: InteractionContextIds,
  options: { keepBackground: boolean },
  rng: Rng = defaultRng,
): void {
  const rootFrameId = resolveRootFrameId(state, context);
  if (rootFrameId === undefined) {
    console.warn(`enterContext: не разрешается root Frame для POI "${context.poiId}"`);
    return;
  }

  const previousInteraction = state.interactionSlice.currentInteraction;
  const previousBackground = previousInteraction?.currentBackground;

  // Встреча завершается при смене контекста, но не при переходах между
  // Frames или повторном открытии того же NPC-контекста.
  if (
    previousInteraction &&
    isNpcContext(previousInteraction) &&
    (previousInteraction.poiId !== context.poiId ||
      previousInteraction.slotId !== context.slotId ||
      previousInteraction.npcId !== context.npcId)
  ) {
    npcDraft.registerNpcMeeting(state, previousInteraction.npcId);
  }

  const interaction: CurrentInteraction = {
    ...context,
    activeFrameId: rootFrameId,
    pendingEvents: [],
    log: [],
    ...(options.keepBackground && previousBackground !== undefined
      ? { currentBackground: previousBackground }
      : {}),
  };

  state.interactionSlice.currentInteraction = interaction;
  state.interactionSlice.isTrading = false;

  // Дневное состояние субъекта восстанавливается до сборки очереди.
  if (isNpcContext(context)) {
    ensureNpcDailyTension(state, context.npcId, rng);
  }

  collectInterceptorQueue(state, rng);
  scheduleForceExitIfTense(state, rng);
  processPendingEvents(state, rng);

  // Очередь не открыла Frame — показываем обычный root.
  if (state.interactionSlice.currentInteraction?.activeFrameId === rootFrameId) {
    openFrame(state, rootFrameId);
  }

  // Шансы бросаются после того, как определён фактически показываемый Frame.
  rollVisibleAppearanceChances(state, rng);
}

/** Вход в POI: travel сбрасывает фон перед первым Frame нового interaction. */
export function enterPoiContext(state: StoreState, poiId: string, rng: Rng = defaultRng): void {
  const keepBackground = state.interactionSlice.currentInteraction?.poiId === poiId;

  enterContext(state, { poiId }, { keepBackground }, rng);
}

/**
 * Переход к NPC в slot текущего POI.
 *
 * Партию он не перемещает, а фон сохраняет: slot root без собственного фона
 * наследует фон POI.
 */
export function enterSlotContext(
  state: StoreState,
  slotId: string,
  npcId: string,
  rng: Rng = defaultRng,
): void {
  const poiId = state.interactionSlice.currentInteraction?.poiId;
  if (poiId === undefined) return;

  const occupant = state.occupancySlice.slotOccupants[poiId]?.[slotId];

  // Runtime проверяет, что NPC действительно занимает указанный slot.
  if (occupant !== npcId) {
    console.warn(`enterSlotContext: NPC "${npcId}" не занимает slot "${slotId}"`);
    return;
  }

  enterContext(state, { poiId, slotId, npcId }, { keepBackground: true }, rng);
}

/**
 * Актуализация после смены time slot.
 *
 * Schedules и occupancy к этому моменту уже обновлены. Старый снимок
 * неактуален, поэтому authored-очередь заменяется новой; промежуточные time
 * slots очередей не строят. Запланированный system `forceExit` пересборку
 * переживает и остаётся единственным pending item.
 */
export function refreshInteractionForTimeSlot(state: StoreState, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  const poi = state.poiSlice.pois[interaction.poiId];

  if (!poi || !isNonCellNode(poi) || poi.pendingRemoval) {
    endInteraction(state);
    return;
  }

  // Occupant мог уйти из slot: прежний NPC-контекст закрывается.
  if (isNpcContext(interaction)) {
    const occupant = state.occupancySlice.slotOccupants[interaction.poiId]?.[interaction.slotId];

    if (occupant !== interaction.npcId) {
      enterPoiContext(state, interaction.poiId, rng);
      return;
    }
  }

  if (interaction.pendingEvents.some((event) => event.type === 'forceExit')) return;

  collectInterceptorQueue(state, rng);

  // Если игрок во внутреннем Frame, новая очередь ждёт возврата в root.
  if (isAtRoot(state)) {
    scheduleForceExitIfTense(state, rng);
    processPendingEvents(state, rng);
  }
}
