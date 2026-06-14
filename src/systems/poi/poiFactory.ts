import { POI_TEMPLATES_DB } from '@/data/poi.templates';
import type {
  CellDetails,
  CellPoiNode,
  InitialCellDetails,
  InitialNonCellPoiNode,
  InitialPoi,
  NonCellPoiNode,
  PoiNode,
  PoiNpcPlacement,
  PoiTemplate,
  RegionParameters,
  UniversalPoiDetails,
} from '@/types/poi.types';
import { makeInstanceId, stripLastUnderscoreSegment } from '@/utils/utils';

/* ======================================
   Details resolvers
====================================== */

/**
 * Приводит initial cell details к runtime CellDetails
 */
export function resolveCellDetails(details: InitialCellDetails): CellDetails {
  const regionParameters = {
    threat: details.regionParameters?.threat ?? 0,
    contamination: details.regionParameters?.contamination ?? 0,
    prosperity: details.regionParameters?.prosperity ?? 0,
    techLevel: details.regionParameters?.techLevel ?? 0,
  };

  return {
    col: details.col,
    row: details.row,
    terrain: details.terrain,

    regionParameters,

    visitedTimes: details.visitedTimes ?? 0,
    explorationLevel: details.explorationLevel ?? 0,
    explorationDaysLeft: details.explorationDaysLeft ?? 0,
  };
}

/* ======================================
   Universal non-cell details resolver
====================================== */

/**
 * Resolves the effective RegionParameters for a non-cell POI.
 *
 * Resolution order (per Phase 3.4):
 *   1. Base: root cell's regionParameters
 *   2. Override: poi.details.regionParameters (replaces specific keys)
 *   3. Modifiers: poi.details.regionParameterModifiers (additive delta per key)
 *   4. Clamp: all values clamped to minimum 0
 */
export function resolveEffectiveRegionParameters(
  poiDetails: UniversalPoiDetails,
  cellRegionParameters: RegionParameters,
): RegionParameters {
  const override = poiDetails.regionParameters ?? {};
  const mods = poiDetails.regionParameterModifiers ?? {};

  const clamp = (v: number) => Math.max(0, v);

  return {
    threat: clamp((override.threat ?? cellRegionParameters.threat) + (mods.threat ?? 0)),
    prosperity: clamp(
      (override.prosperity ?? cellRegionParameters.prosperity) + (mods.prosperity ?? 0),
    ),
    contamination: clamp(
      (override.contamination ?? cellRegionParameters.contamination) + (mods.contamination ?? 0),
    ),
    techLevel: clamp(
      (override.techLevel ?? cellRegionParameters.techLevel) + (mods.techLevel ?? 0),
    ),
  };
}

/**
 * Produces a UniversalPoiDetails bag from a template + optional overrides.
 * The node's `type` field becomes the content key (template id).
 */
export function resolveUniversalDetails({
  poiType,
  detailsOverride = {},
  detailsBase = {},
}: {
  poiType: string;
  detailsOverride?: Record<string, any>;
  detailsBase?: Record<string, any>;
}): UniversalPoiDetails {
  const template = POI_TEMPLATES_DB[poiType];
  if (!template) {
    throw new Error(`POI template not found: ${poiType}`);
  }

  const isLocalSpotTemplate = template.isLocalSpot === true;

  const defaults: Partial<UniversalPoiDetails> = {
    isDiscovered: isLocalSpotTemplate ? true : false,
    explorationThreshold: 0,
  };

  return {
    ...defaults,
    ...detailsBase,
    ...(template.details ?? {}),
    ...detailsOverride,
  } as UniversalPoiDetails;
}

/* ======================================
   POI Factory
====================================== */

interface CreatePoiFromTemplateParams {
  id?: string;
  poiType: string;
  parentId: string | null;
  rootCellId: string;
  detailsOverride?: Record<string, any>;
  npcPlacement?: PoiNpcPlacement;
}

export function createPoiFromTemplate({
  id,
  poiType,
  parentId,
  rootCellId,
  detailsOverride,
  npcPlacement,
}: CreatePoiFromTemplateParams): NonCellPoiNode {
  const template: PoiTemplate | undefined = POI_TEMPLATES_DB[poiType];
  if (!template) {
    throw new Error(`POI template not found: ${poiType}`);
  }

  const finalId = id ?? `${stripLastUnderscoreSegment(rootCellId)}_${poiType}_${makeInstanceId()}`;

  const details = resolveUniversalDetails({ poiType, detailsOverride });

  return {
    id: finalId,
    parentId,
    rootCellId,
    nestedPoiIds: [],
    localSpotIds: [],
    isLocalSpot: template.isLocalSpot === true ? true : undefined,
    type: poiType,
    details,
    npcPlacement: npcPlacement ?? template.npcPlacement,
  };
}

/**
 * Создание POI из initial descriptor
 */
export function createPoiFromDescriptor(entry: InitialPoi): PoiNode {
  if (entry.type === 'cell') {
    const details = resolveCellDetails(entry.details as InitialCellDetails);

    return {
      id: entry.id,
      parentId: entry.parentId,
      rootCellId: entry.rootCellId,
      nestedPoiIds: [],
      localSpotIds: [],
      type: 'cell',
      details,
    } satisfies CellPoiNode;
  }

  const poiType = entry.type;
  if (!poiType) {
    throw new Error(`Non-cell POI must have a content key in type. POI id: ${entry.id}`);
  }

  const nonCellEntry = entry as InitialNonCellPoiNode;

  return createPoiFromTemplate({
    id: entry.id,
    poiType,
    parentId: entry.parentId,
    rootCellId: entry.rootCellId,
    detailsOverride: entry.details as any,
    npcPlacement: nonCellEntry.npcPlacement,
  });
}
