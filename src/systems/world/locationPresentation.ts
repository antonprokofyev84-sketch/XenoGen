import { INITIAL_FRAMES } from '@/data/initial/frames';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import textData from '@/locales/en.json';
import type { StoreState } from '@/state/useGameState';
import { resolveText } from '@/systems/text/resolveText';
import type { ResolvedRegionLevels } from '@/types/region.types';
import { isCellNode } from '@/types/worldNode.types';

import { resolvePoiEntryBlock } from './poiEntry';
import type { PoiEntryBlockReason } from './poiEntry';
import { resolveCellRegionLevels, resolvePoiRegionLevels } from './regionLevels';

export interface LocationPresentation {
  title: string;
  parentTitle?: string;
  status: string;
  levels?: ResolvedRegionLevels;
}

type LocationState = Pick<StoreState, 'poiSlice' | 'world'>;
export const POI_ENTRY_BLOCK_LABELS: Readonly<Record<PoiEntryBlockReason, string>> =
  textData.worldUi.entryBlocks;

/** One title rule for the HUD, navigation and interaction panel. */
export function resolvePoiDisplayName(templateId: string): string {
  return resolveText(
    INITIAL_FRAMES[templateId]?.title ??
      textData.poi[templateId as keyof typeof textData.poi]?.name ??
      templateId,
  );
}

export function resolveWorldNodeTitle(state: Pick<StoreState, 'poiSlice'>, id: string): string {
  const node = state.poiSlice.pois[id];
  if (!node) return id;
  if (isCellNode(node))
    return `${textData.mapCellTypes[node.details.terrain]} (${node.details.col}, ${node.details.row})`;
  return resolvePoiDisplayName(node.templateId);
}

export function resolveLocationPresentation(
  state: LocationState,
  id: string,
): LocationPresentation {
  const node = state.poiSlice.pois[id];
  if (!node)
    return { title: textData.worldUi.unknownLocation, status: textData.worldUi.noInformation };
  const root = state.poiSlice.pois[node.rootCellId];
  const cell = root && isCellNode(root) ? root : undefined;
  const known = cell !== undefined && cell.details.visitedTimes > 0;
  if (isCellNode(node))
    return {
      title: resolveWorldNodeTitle(state, id),
      status: textData.worldUi.region,
      levels: known ? resolveCellRegionLevels(node.details.regionParameters) : undefined,
    };
  const block = resolvePoiEntryBlock(state, id);
  let status = textData.worldUi.open;
  if (node.pendingRemoval) {
    status = textData.worldUi.pendingRemoval;
  } else if (block) {
    status = POI_ENTRY_BLOCK_LABELS[block];
  }
  return {
    title: resolveWorldNodeTitle(state, id),
    parentTitle: resolveWorldNodeTitle(state, node.parentId),
    status,
    levels:
      known && cell
        ? resolvePoiRegionLevels(
            cell.details.regionParameters,
            POI_TEMPLATES[node.templateId] ?? {},
          )
        : undefined,
  };
}
