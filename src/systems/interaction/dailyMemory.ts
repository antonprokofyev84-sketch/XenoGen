import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng, randomInt, rollChance } from '@/systems/rolls/rng';
import type { ActionContext, ActionNumber, ExecutionLimit } from '@/types/action.types';
import type {
  DailyExecutableMemory,
  InteractionSubjectKey,
  SubjectDailyInteractionMemory,
  SubjectExecutionTotals,
} from '@/types/interactionRuntime.types';
import { toNpcSubjectKey } from '@/types/interactionRuntime.types';

import { resolveNpcEffectiveRelation } from './effectiveRelation';
import { resolveActionNumber } from './outcomes';

/**
 * Память исполнения Actions и Interceptors.
 *
 * Сроков жизни два: дневная память очищается целиком в конце игрового дня,
 * долговременные totals сохраняются. Записи создаются только под нужный
 * механизм, поэтому вызовы «на всякий случай» ничего не считают.
 */

/** Реестры Actions и Interceptors различаются, поэтому память разделена. */
export type ExecutableKind = 'actions' | 'interceptors';

const TENSION_MIN = 0;
const TENSION_MAX = 100;
const TENSION_RANDOM_OFFSET = 20;

/** Порог, при достижении которого планируется system `ForceExit`. */
export const FORCE_EXIT_TENSION_THRESHOLD = 80;

const ensureSubjectMemory = (
  state: StoreState,
  subjectKey: InteractionSubjectKey,
): SubjectDailyInteractionMemory => {
  const existing = state.interactionSlice.dailyMemoryBySubject[subjectKey];
  if (existing) return existing;

  const created: SubjectDailyInteractionMemory = { actions: {}, interceptors: {} };
  state.interactionSlice.dailyMemoryBySubject[subjectKey] = created;

  return created;
};

const ensureSubjectTotals = (
  state: StoreState,
  subjectKey: InteractionSubjectKey,
): SubjectExecutionTotals => {
  const existing = state.interactionSlice.executionTotalsBySubject[subjectKey];
  if (existing) return existing;

  const created: SubjectExecutionTotals = { actions: {}, interceptors: {} };
  state.interactionSlice.executionTotalsBySubject[subjectKey] = created;

  return created;
};

const readDailyEntry = (
  state: StoreState,
  subjectKey: InteractionSubjectKey,
  kind: ExecutableKind,
  executableId: string,
): DailyExecutableMemory | undefined =>
  state.interactionSlice.dailyMemoryBySubject[subjectKey]?.[kind][executableId];

const readTotal = (
  state: StoreState,
  subjectKey: InteractionSubjectKey,
  kind: ExecutableKind,
  executableId: string,
): number => state.interactionSlice.executionTotalsBySubject[subjectKey]?.[kind][executableId] ?? 0;

/**
 * Исчерпан ли лимит попыток.
 *
 * Засчитывается именно начатая попытка, поэтому провал `check` лимит тоже
 * расходует.
 */
export function isExecutionLimitReached(
  state: StoreState,
  subjectKey: InteractionSubjectKey,
  kind: ExecutableKind,
  executableId: string,
  limit: ExecutionLimit | undefined,
): boolean {
  if (!limit) return false;

  if (limit.perDay !== undefined) {
    const executions = readDailyEntry(state, subjectKey, kind, executableId)?.executions ?? 0;
    if (executions >= limit.perDay) return true;
  }

  if (limit.total !== undefined) {
    if (readTotal(state, subjectKey, kind, executableId) >= limit.total) return true;
  }

  return false;
}

/** Отмечает начатую попытку в обеих картах, если соответствующий лимит задан. */
export function countExecution(
  state: StoreState,
  subjectKey: InteractionSubjectKey,
  kind: ExecutableKind,
  executableId: string,
  limit: ExecutionLimit | undefined,
): void {
  if (!limit) return;

  if (limit.perDay !== undefined) {
    const memory = ensureSubjectMemory(state, subjectKey);
    const entry = memory[kind][executableId] ?? {};

    entry.executions = (entry.executions ?? 0) + 1;
    memory[kind][executableId] = entry;
  }

  if (limit.total !== undefined) {
    const totals = ensureSubjectTotals(state, subjectKey);
    totals[kind][executableId] = (totals[kind][executableId] ?? 0) + 1;
  }
}

/**
 * Дневной результат `appearanceChance`.
 *
 * Бросок выполняется один раз за день при первой допустимой актуализации и
 * сохраняется; повторный вход, смена Frame или time slot в тот же день
 * используют прежний результат. Отсутствие записи и сохранённое `false` —
 * разные состояния, поэтому проверка идёт на `undefined`.
 */
export function resolveAppearance(
  state: StoreState,
  subjectKey: InteractionSubjectKey,
  kind: ExecutableKind,
  executableId: string,
  chance: ActionNumber | undefined,
  context: ActionContext,
  rng: Rng = defaultRng,
): boolean {
  if (chance === undefined) return true;

  const stored = readDailyEntry(state, subjectKey, kind, executableId)?.appeared;
  if (stored !== undefined) return stored;

  const appeared = rollChance(rng, resolveActionNumber(chance, context));

  const memory = ensureSubjectMemory(state, subjectKey);
  const entry = memory[kind][executableId] ?? {};
  entry.appeared = appeared;
  memory[kind][executableId] = entry;

  return appeared;
}

/**
 * Дневной tension NPC.
 *
 * Считается при первом взаимодействии за день и переиспользуется при
 * повторных. Знак отрицательный намеренно: хорошее отношение снижает
 * напряжение.
 *
 * ```text
 * tension = clamp(-effectiveRelation + randomOffset, 0, 100)
 * randomOffset — целое из [-20, 20]
 * ```
 */
export function ensureNpcDailyTension(
  state: StoreState,
  npcId: string,
  rng: Rng = defaultRng,
): number {
  const subjectKey = toNpcSubjectKey(npcId);
  const memory = ensureSubjectMemory(state, subjectKey);

  if (memory.tension !== undefined) return memory.tension;

  // Неразрешимое отношение считается нейтральным: tension всё равно нужен.
  const effectiveRelation = resolveNpcEffectiveRelation(state, npcId) ?? 0;

  const randomOffset = randomInt(rng, -TENSION_RANDOM_OFFSET, TENSION_RANDOM_OFFSET);
  const tension = Math.min(
    TENSION_MAX,
    Math.max(TENSION_MIN, Math.round(-effectiveRelation + randomOffset)),
  );

  memory.tension = tension;

  return tension;
}

export function modifyNpcDailyTension(state: StoreState, npcId: string, delta: number): number {
  const memory = ensureSubjectMemory(state, toNpcSubjectKey(npcId));
  const current = memory.tension ?? 0;
  const next = Math.min(TENSION_MAX, Math.max(TENSION_MIN, current + delta));

  memory.tension = next;

  return next;
}

/** Конец дня очищает дневную память целиком, в том числе при активном interaction. */
export function clearDailyInteractionMemory(state: StoreState): void {
  state.interactionSlice.dailyMemoryBySubject = {};
}
