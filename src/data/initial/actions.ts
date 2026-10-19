import type { InitialActionMap } from '@/types/action.types';

import { FIXTURE_ACTIONS } from './fixtures/actions.fixture';

/**
 * Плоский реестр Action definitions.
 *
 * `ActionId` является ключом реестра, поэтому поле `id` внутри Action не
 * хранится. Один Action может использоваться в нескольких Frames.
 */
export const INITIAL_ACTIONS: InitialActionMap = { ...FIXTURE_ACTIONS };
