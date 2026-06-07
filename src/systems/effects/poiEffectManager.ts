// import { GRID_COLS, GRID_ROWS } from '@/constants';
import { poiDraft } from '@/state/gameSlices/poi';
import type { StoreState } from '@/state/useGameState';
import type { EffectsMap, PoiAction } from '@/types/poi.types';

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
    case 'removeSelf': {
      poiDraft.removePoiWithDependencies(draft, poiId);
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
        case 'techLevel':
          poiDraft.modifyCellTechLevel(draft, currentCellId, action.delta);
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

