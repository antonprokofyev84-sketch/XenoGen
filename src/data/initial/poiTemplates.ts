import type { PoiTemplateMap } from '@/types/poiContent.types';

import { FIXTURE_POI_TEMPLATES } from './fixtures/poiTemplates.fixture';

/**
 * Механические описания POI.
 *
 * `templateId` — не тип POI, а ссылка на отдельный definition: для уникального
 * авторского POI он описывает один конкретный объект, для процедурного может
 * использоваться множеством экземпляров.
 */
export const POI_TEMPLATES: PoiTemplateMap = { ...FIXTURE_POI_TEMPLATES };
