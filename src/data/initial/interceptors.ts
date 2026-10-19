import type { InitialInterceptorMap } from '@/types/interceptor.types';

import { FIXTURE_INTERCEPTORS } from './fixtures/interceptors.fixture';

/**
 * Плоский реестр Interceptor definitions.
 *
 * Interceptors собираются отдельно от Actions и не появляются в списке кнопок.
 * System `forceExit` не является authored definition и в реестре отсутствует.
 */
export const INITIAL_INTERCEPTORS: InitialInterceptorMap = { ...FIXTURE_INTERCEPTORS };
