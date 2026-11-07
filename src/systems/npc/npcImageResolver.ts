import { INITIAL_NPCS } from '@/data/initial/npcs';
import { resolveCharacterSilhouette } from '@/systems/characters/characterImageFallback';
import type { NpcId } from '@/types/ids.types';

/**
 * Базовые визуалы NPC.
 *
 * Визуальные assets отделены от авторских данных NPC: запись ищется по
 * `npcId`, поэтому дублировать ключ полем вида `visualSet` не нужно.
 *
 * ```text
 * src/assets/npcs/<npcId>/full-body.webp
 * ```
 *
 * Расширенный resolver варианта по роли, экипировке, состоянию и настроению
 * отложен; здесь только baseline-запись.
 */
const npcImages = import.meta.glob<string>('/src/assets/npcs/*/full-body.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Индексирует изображения по имени папки NPC. */
function indexImagesByNpcId(images: Record<string, string>): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(images).flatMap(([path, url]) => {
      const npcId = path.split('/').at(-2);

      return npcId === undefined ? [] : [[npcId, url]];
    }),
  );
}

const imageByNpcId = indexImagesByNpcId(npcImages);

export function resolveNpcSilhouette(npcId: NpcId): string {
  return resolveCharacterSilhouette(INITIAL_NPCS[npcId]?.gender);
}

/** Нет индивидуальной фигуры — показываем подходящий силуэт. */
export function resolveNpcImage(npcId: NpcId | undefined): string | undefined {
  return npcId === undefined ? undefined : (imageByNpcId[npcId] ?? resolveNpcSilhouette(npcId));
}

const portraitImages = import.meta.glob<string>('/src/assets/npcs/*/portrait.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const portraitByNpcId = indexImagesByNpcId(portraitImages);
export function resolveNpcPortrait(npcId: NpcId): string | undefined {
  return portraitByNpcId[npcId];
}
