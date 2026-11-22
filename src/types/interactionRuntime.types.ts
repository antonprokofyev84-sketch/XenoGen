import type { ActionId, FrameId, InterceptorId, NpcId, PoiId, SlotId } from './ids.types';
import type { NarrativeBlock } from './narrativeBlock.types';

/**
 * Runtime взаимодействия.
 *
 * В текущем контексте всегда есть ID конкретного экземпляра POI. Пара
 * `slotId + npcId` присутствует либо целиком, либо отсутствует целиком:
 * отдельный дискриминатор и вложенный объект контекста не нужны.
 */

// ============================================================
// Субъект памяти
// ============================================================

/**
 * Ключ памяти исполнения.
 *
 * Субъект POI-контекста — конкретный `poiId`, slot/NPC-контекста — конкретный
 * `npcId`. `slotId` и `frameId` в ключ не входят: смена бармена не должна
 * менять субъект Action, принадлежащего самому заведению.
 */
export type InteractionSubjectKey = `poi:${PoiId}` | `npc:${NpcId}`;

export const toPoiSubjectKey = (poiId: PoiId): InteractionSubjectKey => `poi:${poiId}`;

export const toNpcSubjectKey = (npcId: NpcId): InteractionSubjectKey => `npc:${npcId}`;

/**
 * Запись создаётся только под нужный механизм: `perDay` требует счётчика,
 * `appearanceChance` — сохранённого результата броска.
 */
export interface DailyExecutableMemory {
  executions?: number;
  appeared?: boolean;
}

export interface SubjectDailyInteractionMemory {
  actions: Partial<Record<ActionId, DailyExecutableMemory>>;
  interceptors: Partial<Record<InterceptorId, DailyExecutableMemory>>;

  /**
   * Дневной tension; существует только у npc-субъекта.
   *
   * Резолвится при первом взаимодействии за день, переиспользуется при
   * повторных и стирается в конце дня вместе с остальной дневной памятью.
   */
  tension?: number;
}

export type DailyInteractionMemoryBySubject = Partial<
  Record<InteractionSubjectKey, SubjectDailyInteractionMemory>
>;

/** Долговременные счётчики: конец дня их не очищает. */
export interface SubjectExecutionTotals {
  actions: Partial<Record<ActionId, number>>;
  interceptors: Partial<Record<InterceptorId, number>>;
}

export type ExecutionTotalsBySubject = Partial<
  Record<InteractionSubjectKey, SubjectExecutionTotals>
>;

// ============================================================
// Очередь событий входа
// ============================================================

/**
 * Элемент очереди входа.
 *
 * System `forceExit` является отдельным вариантом union и не маскируется под
 * `InterceptorId`: он не проходит авторские проверки.
 */
export type PendingInteractionEvent =
  | { type: 'interceptor'; interceptorId: InterceptorId }
  | { type: 'forceExit' };

// ============================================================
// Текущее взаимодействие
// ============================================================

/** Снимок уже разрешённого narrative; задним числом он не меняется. */
export interface InteractionLogEntry {
  blocks: NarrativeBlock[];
}

export interface CurrentInteraction {
  poiId: PoiId;
  /** Присутствует вместе с `npcId`, когда игрок разговаривает с occupant этого slot. */
  slotId?: SlotId;
  /** Наличие NPC отличает разговор от обычного POI-контекста. */
  npcId?: NpcId;
  /** Всегда настоящий ID Frame: `undefined` не означает root. */
  activeFrameId: FrameId;
  pendingEvents: PendingInteractionEvent[];
  /** Разрешённый URL; отсутствие означает «не менять текущий фон». */
  currentBackground?: string;
  /** Только подтверждённые через Continue порции текста. */
  log: InteractionLogEntry[];
  /** Текущая порция: разрешённые blocks, без effects, времени и переходов. */
  currentEntry: InteractionLogEntry | null;
}

/** Субъект памяти interaction или собранного для него ActionContext. */
export const resolveSubjectKey = (subject: {
  readonly poiId: PoiId;
  readonly npcId?: NpcId;
}): InteractionSubjectKey =>
  subject.npcId === undefined ? toPoiSubjectKey(subject.poiId) : toNpcSubjectKey(subject.npcId);

/** Контекст конкретного NPC; только он имеет дневной tension и force exit. */
export const isNpcContext = (
  interaction: CurrentInteraction,
): interaction is CurrentInteraction & { slotId: SlotId; npcId: NpcId } =>
  interaction.npcId !== undefined;
