import type { NpcId } from '@/types/ids.types';

/**
 * Базовые визуалы NPC.
 *
 * Визуальные assets отделены от авторских данных NPC: запись ищется по
 * `npcId`, поэтому дублировать ключ полем вида `visualSet` не нужно.
 *
 * ```text
 * src/assets/npcs/<npcId>/default.webp
 * ```
 *
 * Расширенный resolver варианта по роли, экипировке, состоянию и настроению
 * отложен; здесь только baseline-запись.
 */
const npcImages = import.meta.glob<string>('/src/assets/npcs/*/default.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const imageByNpcId: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(npcImages).flatMap(([path, url]) => {
    const npcId = path.split('/').at(-2);

    return npcId === undefined ? [] : [[npcId, url]];
  }),
);

/** Отсутствие записи — обычное состояние: NPC просто не показывается overlay. */
export function resolveNpcImage(npcId: NpcId | undefined): string | undefined {
  return npcId === undefined ? undefined : imageByNpcId[npcId];
}
