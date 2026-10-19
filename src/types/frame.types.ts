import type { ActionId } from './ids.types';
import type { NarrativeBlock } from './narrativeBlock.types';

/**
 * Контракт авторских Frames.
 *
 * Frame является пассивным описанием отображаемого состояния. Он не содержит
 * runtime-состояния, conditions, checks, costs, effects, transitions и
 * счётчиков: всё это принадлежит Actions, их результатам и runtime-памяти.
 */

/**
 * ```text
 * none    → не показывать NPC overlays
 * speaker → показывать NPC, произносящего текущую реплику
 * always  → постоянно показывать NPC текущего slot-контекста
 * ```
 */
export type NpcDisplayMode = 'none' | 'speaker' | 'always';

export const DEFAULT_NPC_DISPLAY_MODE: NpcDisplayMode = 'speaker';

/** Зарезервированные имена системных Frames контекста. */
export const RESERVED_FRAME_NAMES = {
  /** Будущий Frame закрытого POI; в первой версии не используется. */
  closed: 'closed',
  /** Frame принудительного выхода; существует только в slot/NPC-контексте. */
  forceExit: 'forceExit',
} as const;

export interface InitialFrame {
  /**
   * Разрешённый Vite URL изображения.
   * Отсутствие означает не менять текущий background.
   */
  background?: string;

  /** Отсутствие означает `speaker`. */
  npcDisplay?: NpcDisplayMode;

  /** Narrative, добавляемый при входе во Frame. */
  narrative?: NarrativeBlock[];

  /** Ссылки на собственные Actions Frame; сами definitions хранятся отдельно. */
  actionIds?: ActionId[];
}

export type InitialFrameMap = Record<string, InitialFrame>;
