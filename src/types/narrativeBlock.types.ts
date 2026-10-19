import type { LocalizedText } from './common.types';
import type { CharacterId } from './ids.types';

/**
 * Narrative-блоки авторского контента.
 *
 * Формат намеренно компактный и не требует discriminant `type` у каждого блока:
 *
 * ```text
 * string              → описание ситуации
 * { speakerId, text } → прямая речь персонажа
 * { thought }         → мысль протагониста
 * ```
 */

/** Ссылка на NPC текущего slot-контекста в `speakerId`. */
export const CURRENT_NPC_SPEAKER = '$npc';
export type CurrentNpcSpeaker = typeof CURRENT_NPC_SPEAKER;

/**
 * Placeholder внутри текста, подставляющий отображаемое имя знакомого NPC
 * либо название роли незнакомого.
 */
export const CURRENT_NPC_NAME_PLACEHOLDER = '{$npc}';
export interface DialogueLine {
  speakerId: CharacterId | CurrentNpcSpeaker;
  text: LocalizedText;
}
export interface ThoughtLine {
  thought: LocalizedText;
}
export type NarrativeBlock = LocalizedText | DialogueLine | ThoughtLine;
export function isDialogueLine(block: NarrativeBlock): block is DialogueLine {
  return typeof block === 'object' && 'speakerId' in block;
}

export function isThoughtLine(block: NarrativeBlock): block is ThoughtLine {
  return typeof block === 'object' && 'thought' in block;
}
