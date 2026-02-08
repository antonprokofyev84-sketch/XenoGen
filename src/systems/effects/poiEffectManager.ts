// import { GRID_COLS, GRID_ROWS } from '@/constants';
import { poiDraft } from '@/state/gameSlices/poi';
import type { StoreState } from '@/state/useGameState';
import type { EffectsMap, PoiAction } from '@/types/poi_template.types';

type EffectContext = { state: StoreState };

const rng = Math.random;

export const PoiEffectManager = {
  processPoiEffects(effectsByPoi: EffectsMap, context: EffectContext) {
    for (const poiId of Object.keys(effectsByPoi)) {
      const rules = effectsByPoi[poiId] ?? [];
      for (const rule of rules) {
        for (const action of rule.do ?? []) {
          if (action.chance !== undefined && rng() > action.chance) continue;
          applyEffectToDraft(context.state, action, poiId);
        }
      }
    }
  },
};

// Here we are applying effect actions directly in the same Immer draft
// so we can mutate the draft state safely.
// all accumulated changes will be committed at once after this function completes.

function applyEffectToDraft(draft: StoreState, action: PoiAction, poiId: string) {
  const currentPoi = draft.poiSlice.pois[poiId];
  if (!currentPoi) return;
  const currentCellId = currentPoi.rootCellId;

  switch (action.kind) {
    case 'modifySelfProgress': {
      poiDraft.modifyPoiProgress(draft, poiId, action.delta);
      return;
    }
    case 'removeSelf': {
      poiDraft.removePoiSubtree(draft, poiId);
      return;
    }
    case 'changeCurrentCellParam': {
      const cellParam = action.cellParam;
      switch (cellParam) {
        case 'threat':
          poiDraft.modifyCellThreat(draft, currentCellId, action.delta);
          break;
        case 'contamination':
          poiDraft.modifyCellContamination(draft, currentCellId, action.delta);
          break;
        case 'prosperity':
          poiDraft.modifyCellProsperity(draft, currentCellId, action.delta);
          break;
        default:
          throw new Error(`Unknown cellParam: ${cellParam}`);
      }
      return;
    }
    default:
      throw new Error(`Unknown PoiAction kind: ${(action as any).kind}`);
  }
}

// case 'changeCellParamInRadius': {
//   const center = draft.poiSlice.pois[currentCellId];
//   if (!center || center.type !== 'cell') return;
//   const { col, row } = center.details;
//   const r = action.radius;
//   const chance = action.perCellChance ?? 1;
//   for (let dx = -r; dx <= r; dx++) {
//     for (let dy = -r; dy <= r; dy++) {
//       const c = col + dx;
//       const rrow = row + dy;
//       if (c < 0 || rrow < 0 || c >= GRID_COLS || rrow >= GRID_ROWS) continue;
//       // Cells are identified by "col-row"
//       const cid = `${c}-${rrow}`;
//       const cellNode = draft.poiSlice.pois[cid];
//       if (!cellNode || cellNode.type !== 'cell') continue;
//       if (rng() > chance) continue;
//       switch (action.cellParam) {
//         case 'threat':
//           poiDraft.modifyCellThreat(draft, cid, action.delta);
//           break;
//         case 'contamination':
//           poiDraft.modifyCellContamination(draft, cid, action.delta);
//           break;
//         case 'prosperity':
//           poiDraft.modifyCellProsperity(draft, cid, action.delta);
//           break;
//         default:
//           break;
//       }
//     }
//   }
//   return;
// }
// case 'replaceSelf': {
//   // Replace with new template at the same parent cell
//   const parentId = currentCellId;
//   poiDraft.removePoiSubtree(draft, poiId);
//   poiDraft.createPoi({
//     state: draft,
//     poiTemplateId: action.toPoiId,
//     parentId,
//   });
//   return;
// }
// case 'addPoiToCurrentCell': {
//   poiDraft.createPoi({
//     state: draft,
//     poiTemplateId: action.poiId,
//     parentId: currentCellId,
//     detailsOverride: action.params ?? {},
//   });
//   return;
// }
// case 'addPoisInRadius': {
//   const center = draft.poiSlice.pois[currentCellId];
//   if (!center || center.type !== 'cell') return;
//   const { col, row } = center.details;
//   const r = action.radius;
//   const chance = action.perCellChance ?? 1;
//   for (let dx = -r; dx <= r; dx++) {
//     for (let dy = -r; dy <= r; dy++) {
//       const c = col + dx;
//       const rrow = row + dy;
//       if (c < 0 || rrow < 0 || c >= GRID_COLS || rrow >= GRID_ROWS) continue;
//       if (rng() > chance) continue;
//       const cid = `${c}-${rrow}`;
//       const cellNode = draft.poiSlice.pois[cid];
//       if (!cellNode || cellNode.type !== 'cell') continue;
//       poiDraft.createPoi({
//         state: draft,
//         poiTemplateId: action.poiId,
//         parentId: cid,
//         detailsOverride: action.params ?? {},
//       });
//     }
//   }
//   return;
// }
// case 'levelUpSelf': {
//   poiDraft.modifyPoiLevel(draft, poiId, 1);
//   return;
// }
// case 'levelDownSelf': {
//   poiDraft.modifyPoiLevel(draft, poiId, -1);
//   return;
// }
