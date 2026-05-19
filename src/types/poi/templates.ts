/**
 * POI Template система.
 * Универсальная схема шаблона без levels и runtime-категорий.
 */
import type { InteractionService } from '../interaction.types';
import type { PoiTemplateTriggers } from './effects';
import type { UniversalPoiDetails } from './nodes';

/**
 * Универсальный шаблон POI.
 * Ключ в `POI_TEMPLATES_DB` и `PoiNode.type` — это content key.
 */
export type PoiTemplate = {
  /** Если true, созданный узел будет auто-помечен isLocalSpot=true. */
  isLocalSpot?: boolean;
  details: Partial<UniversalPoiDetails> & Record<string, any>;
  services?: InteractionService[];
  triggers?: PoiTemplateTriggers;
};
