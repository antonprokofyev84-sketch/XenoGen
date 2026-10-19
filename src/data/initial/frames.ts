import type { InitialFrameMap } from '@/types/frame.types';

import { FIXTURE_FRAMES } from './fixtures/frames.fixture';

/**
 * Плоский реестр Frame definitions.
 *
 * Контрактом является единый итоговый реестр; группировать definitions по POI,
 * encounters и quests можно в отдельных файлах и объединять здесь.
 *
 * Грамматика `FrameId`:
 *
 * ```text
 * POI context  = templateId
 * slot context = templateId/slotId
 * root Frame   = contextId
 * другой Frame = contextId:framePath
 * ```
 */
export const INITIAL_FRAMES: InitialFrameMap = { ...FIXTURE_FRAMES };
