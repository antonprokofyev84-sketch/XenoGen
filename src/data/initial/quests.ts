import type { InitialQuestMap } from '@/types/questContent.types';

import { FIXTURE_QUESTS } from './fixtures/quests.fixture';

/**
 * Плоский реестр статических квестов.
 *
 * Runtime создаётся сразу для всех квестов при создании новой игры, включая
 * ещё не принятые: это позволяет записывать их переменные заранее.
 */
export const INITIAL_QUESTS: InitialQuestMap = { ...FIXTURE_QUESTS };
