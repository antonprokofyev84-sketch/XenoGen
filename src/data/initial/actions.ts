import type { InitialActionMap } from '@/types/action.types';

import { FIXTURE_ACTIONS } from './fixtures/actions.fixture';
import { CONTEXT_EXIT_ACTIONS } from './interactionExits';

/**
 * Плоский реестр Action definitions.
 *
 * `ActionId` является ключом реестра, поэтому поле `id` внутри Action не
 * хранится. Один Action может использоваться в нескольких Frames.
 */
export const INITIAL_ACTIONS: InitialActionMap = { ...FIXTURE_ACTIONS, ...CONTEXT_EXIT_ACTIONS };
