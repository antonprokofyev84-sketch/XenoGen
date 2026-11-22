import { INITIAL_FRAMES } from '@/data/initial/frames';
import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { npcDraft } from '@/state/gameSlices/npc';
import type { StoreState } from '@/state/useGameState';
import { applyEffects } from '@/systems/effects/applyEffects';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import { isPoiOpenAt } from '@/systems/world/poiSchedule';
import type { FrameId, InterceptorId, NpcId, PoiId, SlotId } from '@/types/ids.types';
import type { CurrentInteraction } from '@/types/interactionRuntime.types';
import { isNpcContext } from '@/types/interactionRuntime.types';
import type { InitialInterceptor, InterceptorResult } from '@/types/interceptor.types';
import { DEFAULT_INTERCEPTOR_PRIORITY } from '@/types/interceptor.types';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import type { NonCellPoiNode } from '@/types/worldNode.types';
import { isNonCellNode } from '@/types/worldNode.types';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

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
import {
  isContextExitFrame,
  resolveCurrentForceExitFrameId,
  resolveCurrentRootFrameId,
} from './frameIds';
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

export function appendNarrative(
  state: StoreState,
  blocks: readonly NarrativeBlock[] | undefined,
): void {
  if (!blocks || blocks.length === 0) return;
  // Текст добавляют Action, Interceptor или Frame уже созданного interaction.
  const interaction = state.interactionSlice.currentInteraction!;

  // Снимок создаётся до показа: смена occupancy, роли или знакомства
  // не меняет текущий текст и его последующую запись в историю.
  const resolved = resolveNarrativeSnapshot(state, blocks);
  interaction.currentEntry ??= { blocks: [] };
  interaction.currentEntry.blocks.push(...resolved);
}

/**
 * Открывает Frame: меняет активный ID, наследует или заменяет фон и
 * добавляет narrative в текущую порцию текста.
 */
export function openFrame(
  state: StoreState,
  frameId: FrameId,
  options: { readNarrative?: boolean } = {},
): void {
  // Arrival создал interaction; все последующие Frames открываются внутри него.
  const interaction = state.interactionSlice.currentInteraction!;
  const frame = INITIAL_FRAMES[frameId];
  if (!frame) {
    console.warn(`openFrame: неизвестный Frame "${frameId}"`);
    return;
  }

  interaction.activeFrameId = frameId;

  // Отсутствие собственного фона означает «не менять текущий».
  if (frame.background !== undefined) {
    interaction.currentBackground = frame.background;
  }

  if (options.readNarrative !== false) appendNarrative(state, frame.narrative);
}

function isAtRoot(state: StoreState): boolean {
  // Вызывающий сценарий уже установил или проверил текущий interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  return interaction.activeFrameId === resolveCurrentRootFrameId(state);
}

/** Обязательный выход из текущего состояния interaction. Состояние не меняет. */
function resolveInteractionExitFrame(state: StoreState): FrameId | undefined {
  // Вызывающие сценарии работают только внутри существующего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId];
  if (!poi || !isNonCellNode(poi)) {
    throw new Error(`Current interaction POI "${interaction.poiId}" is missing`);
  }

  if (poi.pendingRemoval) return CONTEXT_EXIT_FRAMES.poiPendingRemoval;

  if (!isPoiOpenAt(poi, resolveTimeOfDay(state.world.currentTime))) {
    return CONTEXT_EXIT_FRAMES.poiClosed;
  }

  if (isNpcContext(interaction)) {
    const occupants = state.occupancySlice.slotOccupants[interaction.poiId];
    const currentOccupantId = occupants?.[interaction.slotId];

    if (currentOccupantId !== interaction.npcId) {
      return CONTEXT_EXIT_FRAMES.npcLeft;
    }
  }

  return undefined;
}

/** Возврат в root проверяет расписания до его текста и входной очереди. */
export function openRootFrame(state: StoreState, options: { readNarrative?: boolean } = {}): void {
  const rootFrameId = resolveCurrentRootFrameId(state);
  openFrame(state, rootFrameId, { readNarrative: false });
  const exitFrameId = resolveInteractionExitFrame(state);
  if (exitFrameId !== undefined) {
    openFrame(state, exitFrameId);
    return;
  }

  if (options.readNarrative !== false) {
    appendNarrative(state, INITIAL_FRAMES[rootFrameId]?.narrative);
  }
}

// ================================================================
// Источники Interceptors
// ================================================================

function listInterceptorIds(state: StoreState): InterceptorId[] {
  // Очередь собирается для текущего interaction сразу после входа в его root.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId];
  if (!poi || !isNonCellNode(poi)) return [];

  if (!isNpcContext(interaction)) {
    return [
      ...(POI_TEMPLATES[poi.templateId]?.interceptorIds ?? []),
      ...(state.questSlice.questInterceptorIdsByTarget[interaction.poiId] ?? []),
    ];
  }

  const slot = findSlotDefinition(state, interaction.poiId, interaction.slotId);

  return [
    ...(slot?.interceptorIds ?? []),
    ...(INITIAL_NPCS[interaction.npcId]?.interceptorIds ?? []),
    ...(state.questSlice.questInterceptorIdsByTarget[interaction.npcId] ?? []),
  ];
}

// ================================================================
// Сборка очереди
// ================================================================

/**
 * Собирает authored-очередь текущего контекста.
 *
 * Снимок делает цепочку конечной: Interceptors, ставшие активными уже
 * после сборки, попадут только в следующий вход.
 *
 * Массив сортируется по возрастанию приоритета, потому что очередь
 * разбирается с конца.
 */
function collectInterceptorQueue(state: StoreState, rng: Rng): void {
  // Arrival или startNpcConversation уже установили текущий режим interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  const actionContext = buildActionContext(state);

  const candidates: { interceptorId: InterceptorId; priority: number }[] = [];

  for (const interceptorId of listInterceptorIds(state)) {
    const interceptor = INITIAL_INTERCEPTORS[interceptorId];
    if (!interceptor) continue;

    if (isExecutionLimitReached(state, 'interceptors', interceptorId, interceptor.executionLimit)) {
      continue;
    }

    if (!evaluateConditions(state, interceptor.conditions, actionContext)) continue;

    if (
      !resolveAppearance(
        state,
        'interceptors',
        interceptorId,
        interceptor.appearanceChance,
        actionContext,
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
function scheduleForceExit(interaction: CurrentInteraction): void {
  const alreadyScheduled = interaction.pendingEvents.some((event) => event.type === 'forceExit');
  if (alreadyScheduled) return;

  interaction.pendingEvents = [{ type: 'forceExit' }];
}

/** Дневной tension на пороге или выше планирует принудительный выход. */
export function scheduleForceExitIfTense(state: StoreState, rng: Rng): void {
  // Вход, Action и Interceptor выполняются внутри interaction; finishInteractionStep проверяет его.
  const interaction = state.interactionSlice.currentInteraction!;
  if (!isNpcContext(interaction)) return;

  if (ensureNpcDailyTension(state, interaction.npcId, rng) >= FORCE_EXIT_TENSION_THRESHOLD) {
    scheduleForceExit(interaction);
  }
}

// ================================================================
// Исполнение очереди
// ================================================================

function applyInterceptorResult(state: StoreState, result: InterceptorResult, rng: Rng): boolean {
  // executeInterceptor применяет результат в interaction, чья очередь сейчас исполняется.
  const interaction = state.interactionSlice.currentInteraction!;
  applyEffects(state, result.effects, { poiId: interaction.poiId, npcId: interaction.npcId });
  appendNarrative(state, result.narrative);
  if (result.effects?.some((effect) => effect.type === 'modifyTension')) {
    scheduleForceExitIfTense(state, rng);
  }

  const poi = state.poiSlice.pois[interaction.poiId];
  if (poi && isNonCellNode(poi) && poi.pendingRemoval) {
    openFrame(state, CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    return true;
  }

  if (!result.transition) return false;

  const rootFrameId = resolveCurrentRootFrameId(state);
  if (result.transition.frameId === rootFrameId) {
    openRootFrame(state);
  } else {
    openFrame(state, result.transition.frameId);
  }
  return true;
}

function executeInterceptor(
  state: StoreState,
  interceptorId: InterceptorId,
  interceptor: InitialInterceptor,
  rng: Rng,
): boolean {
  // processPendingEvents исполняет Interceptor из очереди существующего interaction.
  const actionContext = buildActionContext(state);

  // Фактический запуск засчитывается, включая провал его `check`.
  countExecution(state, 'interceptors', interceptorId, interceptor.executionLimit);

  if (interceptor.check) {
    const isSuccess = runCheck(state, interceptor.check, actionContext, rng);
    const branch = isSuccess ? interceptor.check.onSuccess : interceptor.check.onFail;

    return applyInterceptorResult(state, branch, rng);
  }

  return applyInterceptorResult(state, interceptor.result, rng);
}

/**
 * Разбирает очередь до первого Frame.
 *
 * Элемент извлекается **до** исполнения и в этот же момент проходит повторную
 * проверку условий: устаревший item молча отбрасывается. Silent Interceptor
 * очередь не приостанавливает.
 */
function processPendingEvents(state: StoreState, rng: Rng): void {
  // Вызывающий вход или finishInteractionStep уже проверил наличие interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  while (true) {
    const event = interaction.pendingEvents.pop();
    if (!event) return;

    if (event.type === 'forceExit') {
      executeForceExit(state);
      return;
    }

    const interceptor = INITIAL_INTERCEPTORS[event.interceptorId];
    if (!interceptor) continue;

    const actionContext = buildActionContext(state);
    if (!evaluateConditions(state, interceptor.conditions, actionContext)) continue;

    if (executeInterceptor(state, event.interceptorId, interceptor, rng)) return;
  }
}

/**
 * Исполняет system `forceExit` в root slot/NPC-контекста.
 *
 * Авторский Frame задаёт более сильный исход; при его отсутствии контекст
 * тихо возвращается в текущий POI.
 */
function executeForceExit(state: StoreState): void {
  const forceExitFrameId = resolveCurrentForceExitFrameId(state);

  if (INITIAL_FRAMES[forceExitFrameId]) {
    openFrame(state, forceExitFrameId);
    return;
  }

  endNpcConversation(state);
}

// ================================================================
// Жизненный цикл interaction и разговоров
// ================================================================

export function endInteraction(state: StoreState): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (interaction && isNpcContext(interaction)) {
    npcDraft.registerNpcMeeting(state, interaction.npcId);
  }

  state.interactionSlice.currentInteraction = null;
  state.interactionSlice.isTrading = false;
}

/** Прибытие в другой POI начинает новое interaction с новой историей. */
export function startPoiInteraction(state: StoreState, poiId: PoiId, rng: Rng = defaultRng): void {
  // travelToPoiDraft уже проверил target и установил партию в этот non-cell POI.
  const poi = state.poiSlice.pois[poiId] as NonCellPoiNode;
  const rootFrameId = poi.templateId;
  state.interactionSlice.currentInteraction = {
    poiId,
    activeFrameId: rootFrameId,
    pendingEvents: [],
    log: [],
    currentEntry: null,
  };
  state.interactionSlice.isTrading = false;

  openRootFrame(state, { readNarrative: false });
  if (!isAtRoot(state)) return;

  collectInterceptorQueue(state, rng);
  processPendingEvents(state, rng);
  if (state.interactionSlice.currentInteraction?.activeFrameId === rootFrameId) {
    appendNarrative(state, INITIAL_FRAMES[rootFrameId]?.narrative);
  }
  rollVisibleAppearanceChances(state, rng);
}

/** Клик по NPC меняет собеседника внутри interaction текущего POI. */
export function startNpcConversation(
  state: StoreState,
  slotId: SlotId,
  npcId: NpcId,
  rng: Rng = defaultRng,
): void {
  // Портрет принадлежит текущему POI interaction и доступен только в режиме Actions.
  const interaction = state.interactionSlice.currentInteraction!;
  if (interaction.slotId === slotId && interaction.npcId === npcId) return;

  if (isNpcContext(interaction)) {
    npcDraft.registerNpcMeeting(state, interaction.npcId);
  }

  interaction.slotId = slotId;
  interaction.npcId = npcId;
  interaction.pendingEvents = [];
  state.interactionSlice.isTrading = false;

  const rootFrameId = resolveCurrentRootFrameId(state);
  openRootFrame(state, { readNarrative: false });
  if (!isAtRoot(state)) return;

  ensureNpcDailyTension(state, npcId, rng);
  collectInterceptorQueue(state, rng);
  scheduleForceExitIfTense(state, rng);
  processPendingEvents(state, rng);
  if (interaction.activeFrameId === rootFrameId) {
    appendNarrative(state, INITIAL_FRAMES[rootFrameId]?.narrative);
  }
  rollVisibleAppearanceChances(state, rng);
}

/** Завершает разговор и возвращает то же interaction в POI root. */
export function endNpcConversation(state: StoreState, rng: Rng = defaultRng): void {
  // Команда выхода доступна только в NPC-контексте текущего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  // Наличие npcId гарантирует startNpcConversation и NPC-вариант UI.
  npcDraft.registerNpcMeeting(state, interaction.npcId!);
  delete interaction.slotId;
  delete interaction.npcId;
  interaction.pendingEvents = [];
  state.interactionSlice.isTrading = false;

  openRootFrame(state);
  if (isAtRoot(state)) rollVisibleAppearanceChances(state, rng);
}

/** Завершает шаг: проверяет актуальность interaction и продолжает его очередь. */
export function finishInteractionStep(state: StoreState, rng: Rng = defaultRng): void {
  if (state.interactionSlice.pendingTransition) return;
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || interaction.currentEntry) return;

  if (isContextExitFrame(interaction.activeFrameId)) return;
  const exitFrameId = resolveInteractionExitFrame(state);
  if (exitFrameId !== undefined) {
    openFrame(state, exitFrameId);
    return;
  }

  scheduleForceExitIfTense(state, rng);
  if (isAtRoot(state)) processPendingEvents(state, rng);

  rollVisibleAppearanceChances(state, rng);
}
