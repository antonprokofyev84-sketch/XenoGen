/**
 * POI Template система.
 * Генераль для всех типов, использует conditional types для type-safety.
 */
import type { PoiTemplateTriggers } from './effects';
import type { EncounterDetails } from './encounter';
import type { FacilityDetails } from './facility';
import type { SpotDetails } from './spot';

/**
 * Все типы POI кроме cell, которые могут иметь template.
 */
export type TemplatePoiType =
  | 'encounter'
  | 'facility'
  | 'spot'
  | 'loot'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'boss'
  | 'quest';

/**
 * Один уровень POI (если есть levels в template).
 */
export type PoiTemplateLevel<T extends TemplatePoiType> = {
  details?: Partial<TemplateDetailsFor<T>>;
  triggers?: PoiTemplateTriggers;
};

/**
 * Главный генерик для template.
 * TypeScript гарантирует что если type='encounter' то details должны быть EncounterTemplateDetails.
 */
export type PoiTemplate<T extends TemplatePoiType = TemplatePoiType> = {
  type: T;
  details: Partial<TemplateDetailsFor<T>>;
  triggers?: PoiTemplateTriggers;
  levels?: Record<number, PoiTemplateLevel<T>>;
};

/**
 * Связь между type и его Details.
 * Используется PoiTemplate для type-safe details.
 */
export type TemplateDetailsFor<T extends TemplatePoiType> = T extends 'encounter'
  ? EncounterDetails
  : T extends 'facility'
    ? FacilityDetails
    : T extends 'spot'
      ? SpotDetails
      : Record<string, any>;

/**
 * Союз всех template типов — для базы данных POI_TEMPLATES_DB.
 */
export type AnyPoiTemplate =
  | PoiTemplate<'encounter'>
  | PoiTemplate<'facility'>
  | PoiTemplate<'spot'>
  | PoiTemplate<'loot'>
  | PoiTemplate<'dungeon'>
  | PoiTemplate<'settlement'>
  | PoiTemplate<'base'>
  | PoiTemplate<'boss'>
  | PoiTemplate<'quest'>;
