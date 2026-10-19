import type {} from '@/types/factions.types';

export const INITIAL_FACTIONS: Record<string, number> = {
  scavengers: -10,
  mercenarys: -10,
  raiders: -50,
  beasts: -100,
  player: 1000,
  // Фракция npc вне сюжетных групп. ЕЕ репутация к игроку не меняется.
  independents: 0,
  // test data
  testAlly: 80,
  testNeutral: 0,
  testEnemy: -80,
};
