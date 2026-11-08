import femaleSilhouette from '@/assets/characters/fallbacks/female-170-v2.png';
import maleSilhouette from '@/assets/characters/fallbacks/male-185-v2.png';
import type { CharacterGender } from '@/types/character.types';

/** Пол не указан — используем мужскую заглушку, не меняя данные персонажа. */
export function resolveCharacterSilhouette(gender?: CharacterGender): string {
  return gender === 'female' ? femaleSilhouette : maleSilhouette;
}
