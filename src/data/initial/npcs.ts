import type { InitialNpcMap } from '@/types/npcContent.types';

import { FIXTURE_NPCS } from './fixtures/npcs.fixture';

/**
 * Initial NPC.
 *
 * Defaults:
 * - `faction` обязательна; NPC вне сюжетных фракций — `independents`
 * - `affection` отсутствует → 0
 * - `timesMet` отсутствует → 0
 * - `actionIds` / `interceptorIds` отсутствуют → персональных записей нет
 */
export const INITIAL_NPCS: InitialNpcMap = { ...FIXTURE_NPCS };
