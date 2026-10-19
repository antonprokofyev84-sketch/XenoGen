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

export type InteractionContextIds =
  | { poiId: PoiId; slotId?: never; npcId?: never }
  | { poiId: PoiId; slotId: SlotId; npcId: NpcId };

export type CurrentInteraction = InteractionContextIds & {
  /** Всегда настоящий ID Frame: `undefined` не означает root. */
  activeFrameId: FrameId;
  pendingEvents: PendingInteractionEvent[];
  /** Разрешённый URL; отсутствие означает «не менять текущий фон». */
  currentBackground?: string;
  log: InteractionLogEntry[];
};

/** Субъект памяти текущего контекста. */
export const resolveSubjectKey = (context: InteractionContextIds): InteractionSubjectKey =>
  context.npcId === undefined ? toPoiSubjectKey(context.poiId) : toNpcSubjectKey(context.npcId);

/** Контекст конкретного NPC; только он имеет дневной tension и force exit. */
export const isNpcContext = (
  context: InteractionContextIds,
): context is { poiId: PoiId; slotId: SlotId; npcId: NpcId } => context.npcId !== undefined;
