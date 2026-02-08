import { POI_TEMPLATES_DB } from '@/data/poi.templates';
import type {
  CellDetails,
  CellPoiNode,
  EncounterDetails,
  EncounterPoiNode,
  GenericPoiNode,
  PoiNode,
} from '@/types/poi.types';
import type { InitialCellDetails, InitialPoi } from '@/types/poi_initial.types';
import type { PoiTemplate } from '@/types/poi_template.types';
import { makeInstanceId, stripLastUnderscoreSegment } from '@/utils/utils';

/* ======================================
   Details resolvers
====================================== */

/**
 * Приводит initial cell details к runtime CellDetails
 */
export function resolveCellDetails(details: InitialCellDetails): CellDetails {
  return {
    col: details.col,
    row: details.row,
    terrain: details.terrain,

    threat: details.threat ?? 0,
    contamination: details.contamination ?? 0,
    prosperity: details.prosperity ?? 0,

    visitedTimes: details.visitedTimes ?? 0,
    explorationLevel: details.explorationLevel ?? 0,
    explorationDaysLeft: details.explorationDaysLeft ?? 0,
  };
}

/**
 * Собирает runtime EncounterDetails из template + overrides
 */
export function resolveEncounterDetails({
  poiTemplateId,
  level,
  detailsOverride = {},
  detailsBase = {},
}: {
  poiTemplateId: string;
  level?: number;
  detailsOverride?: Partial<EncounterDetails>;
  detailsBase?: Partial<EncounterDetails>;
}): EncounterDetails {
  const template = POI_TEMPLATES_DB[poiTemplateId];

  if (!template) {
    throw new Error(`Encounter template not found: ${poiTemplateId}`);
  }
  if (template.type !== 'encounter') {
    throw new Error(`POI template is not of type 'encounter': ${poiTemplateId}`);
  }

  detailsBase.isDiscovered = detailsBase.isDiscovered ?? false;
  detailsBase.explorationThreshold = detailsBase.explorationThreshold ?? 0;

  let resolvedLevel = level;
  let levelDetails: Partial<EncounterDetails> = {};

  if (template.levels) {
    if (resolvedLevel === undefined) {
      resolvedLevel = Math.min(...Object.keys(template.levels).map(Number));
    }

    const levelSpec = template.levels[resolvedLevel];
    if (!levelSpec) {
      throw new Error(`POI template level not found: ${poiTemplateId} level ${resolvedLevel}`);
    }

    levelDetails = levelSpec.details ?? {};
  }

  const details = {
    poiTemplateId,
    level: resolvedLevel,
    ...detailsBase,
    ...template.details,
    ...levelDetails,
    ...detailsOverride,
  } as EncounterDetails;

  if (
    typeof details.progressMax === 'number' &&
    details.progressMax > 0 &&
    details.progress === undefined
  ) {
    details.progress = 0;
  }

  return details;
}

/* ======================================
   POI Factory
====================================== */

interface CreatePoiFromTemplateParams {
  id?: string;
  poiTemplateId: string;
  parentId: string | null;
  rootCellId: string;
  level?: number;
  detailsOverride?: Partial<EncounterDetails> | Record<string, any>;
}

export function createPoiFromTemplate({
  id,
  poiTemplateId,
  parentId,
  rootCellId,
  level,
  detailsOverride,
}: CreatePoiFromTemplateParams): PoiNode {
  const template: PoiTemplate | undefined = POI_TEMPLATES_DB[poiTemplateId];
  if (!template) {
    throw new Error(`POI template not found: ${poiTemplateId}`);
  }

  const finalId =
    id ?? `${stripLastUnderscoreSegment(rootCellId)}_${poiTemplateId}_${makeInstanceId()}`;

  const base = {
    id: finalId,
    parentId,
    rootCellId,
    childrenIds: [] as string[],
  };

  switch (template.type) {
    case 'encounter': {
      const details = resolveEncounterDetails({
        poiTemplateId,
        level,
        detailsOverride: detailsOverride as Partial<EncounterDetails>,
      });

      return {
        ...base,
        type: 'encounter',
        details,
      } satisfies EncounterPoiNode;
    }

    default: {
      return {
        ...base,
        type: template.type as GenericPoiNode['type'],
        details: {
          ...template.details,
          ...detailsOverride,
        },
      } satisfies GenericPoiNode;
    }
  }
}

/**
 * Создание POI из initial descriptor
 */
export function createPoiFromDescriptor(entry: InitialPoi): PoiNode {
  if (entry.type === 'cell') {
    const details = resolveCellDetails(entry.details);

    return {
      id: entry.id,
      parentId: entry.parentId,
      rootCellId: entry.rootCellId,
      childrenIds: [],
      type: 'cell',
      details,
    } satisfies CellPoiNode;
  }

  const poiTemplateId = entry.details.poiTemplateId;
  if (!poiTemplateId) {
    throw new Error(`Non-cell POI must contain details.poiTemplateId. POI id: ${entry.id}`);
  }

  return createPoiFromTemplate({
    id: entry.id,
    poiTemplateId,
    parentId: entry.parentId,
    rootCellId: entry.rootCellId,
    level: entry.details.level,
    detailsOverride: entry.details,
  });
}
