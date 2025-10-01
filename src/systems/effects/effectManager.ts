import type { StoreState } from '@/state/useGameState';
import type { MainStatKey, SkillKey } from '@/types/character.types';
import type { CellProgressKey } from '@/types/map.types';
import type { EffectsMap, PoiAction } from '@/types/poi.types';
import type { Action, Condition, TriggerRule } from '@/types/traits.types';

type EffectContext = {
  state: StoreState;
};

const rng = Math.random;

export const EffectManager = {
  processTraitEffects(effectsByActor: Record<string, TriggerRule[]>, ctx: EffectContext) {
    for (const characterId of Object.keys(effectsByActor)) {
      const rules = effectsByActor[characterId] ?? [];

      for (const rule of rules) {
        if (!evaluateTraitConditions(rule.if, characterId, ctx.state, rng)) continue;
        for (const action of rule.do ?? []) {
          // chance check
          if (action.chance !== undefined && rng() > action.chance) continue;
          applyTraitAction(action, characterId, ctx.state);
        }
      }
    }
  },

  processPoiEffects(effectsByCell: Record<string, EffectsMap>, ctx: EffectContext) {
    for (const cellId of Object.keys(effectsByCell)) {
      const cellPois = effectsByCell[cellId];
      for (const poiId of Object.keys(cellPois)) {
        const rules = cellPois[poiId] ?? [];
        for (const rule of rules) {
          // if i will add conditions later
          // if (!evaluatePoiConditions(rule.if, cellId, poiId, ctx.state, rng)) continue;
          for (const action of rule.do ?? []) {
            // chance check
            if (action.chance !== undefined && rng() > action.chance) continue;
            applyPoiAction(action, cellId, poiId, ctx.state);
          }
        }
      }
    }
  },
};

// === Conditions ===

function evaluateTraitConditions(
  conds: Condition[] | undefined,
  actorId: string,
  state: StoreState,
  rng: () => number,
): boolean {
  if (!conds || conds.length === 0) return true;

  return conds.every((c) => {
    switch (c.kind) {
      //   case 'hasTag': {
      //     const tags = state.characters.byId[actorId]?.tags ?? [];
      //     return Array.isArray(tags) && tags.includes(c.tag);
      //   }
      case 'hasTrait': {
        const list = state.traits.traitsByCharacterId[actorId] ?? [];
        return list.some((t) => t.id === c.id);
      }
      case 'randomChance': {
        return rng() < c.chance;
      }
      case 'mainStatCheck': {
        // const val = state.characters.byId[actorId]?.mainStats?.[c.stat] ?? 0;
        const stateVal = state.characters.byId[actorId]?.mainStats?.[c.stat as MainStatKey];
        return c.comparison === 'gte' ? stateVal >= c.value : stateVal <= c.value;
      }
      default:
        return true;
    }
  });
}

function applyTraitAction(action: Action, characterId: string, state: StoreState) {
  switch (action.kind) {
    // ——— прогресс/длительность активного трейта (нужен sourceTraitId) ———
    // case 'modifyProgress': {
    //   if (state.traits.traitsByCharacterId[characterId].filter(t => t.id === action.id).length === 0) return;
    //   A.traits.setActiveTraitProps(characterId, action.id, (prev) => ({
    //     progress: (prev?.progress ?? 0) + action.delta,
    //   }));
    //   return;
    // }
    // case 'setProgress': {
    //   if (!sourceTraitId) return;
    //   A.traits.setActiveTraitProps(actorId, sourceTraitId, { progress: a.value });
    //   return;
    // }
    case 'setDuration': {
      const isExisting = state.traits.traitsByCharacterId[characterId].some(
        (t) => t.id === action.id,
      );
      if (!isExisting) return;

      state.traits.actions.modifyTrait(characterId, action.id, { duration: action.value });
      return;
    }

    // ——— статы/навыки персонажа ———
    case 'modifyMainStat': {
      state.characters.actions.changeMainStat(
        characterId,
        action.stat as MainStatKey,
        action.delta,
      );
      return;
    }
    case 'setMainStat': {
      state.characters.actions.setMainStat(characterId, action.stat as MainStatKey, action.value);
      return;
    }
    case 'modifySkill': {
      state.characters.actions.changeSkill(characterId, action.skill as SkillKey, action.delta);
      return;
    }
    case 'setSkill': {
      state.characters.actions.setSkill(characterId, action.skill as SkillKey, action.value);
      return;
    }

    // ——— трейты ———
    case 'addTrait': {
      state.traits.actions.addTraitToCharacter(characterId, action.id);
      return;
    }
    case 'removeTrait': {
      state.traits.actions.removeTraitFromCharacter(characterId, action.id);
      return;
    }
    case 'replaceTrait': {
      const isExisting = state.traits.traitsByCharacterId[characterId].some(
        (t) => t.id === action.id,
      );
      if (!isExisting) return;

      state.traits.actions.removeTraitFromCharacter(characterId, action.id);
      state.traits.actions.addTraitToCharacter(characterId, action.toId);
      return;
    }
    // case 'removeGroup': {
    //   A.traits.removeTraitsByGroup(actorId, a.group);
    //   return;
    // }

    // ——— UI/события ———
    // case 'showToast': {
    //   A.ui?.showToast?.(a.textKey);
    //   logs.push({ t: 'toast', key: a.textKey, actorId });
    //   return;
    // }
    // case 'emitEvent': {
    //   A.events?.emit?.(a.event);
    //   logs.push({ t: 'event', ...a.event, actorId });
    //   return;
    // }
  }
}

function applyPoiAction(action: PoiAction, cellId: string, poiId: string, state: StoreState) {
  switch (action.kind) {
    // ——— прогресс/длительность активного пои (нужен sourcePoiId) ———
    case 'modifySelfProgress': {
      const poisInCell = state.pois.poisByCellId[cellId] ?? [];
      const poi = poisInCell.find((p) => p.id === poiId);
      if (!poi) return;

      state.pois.actions.modifyPoiProgress(cellId, poiId, action.delta);
      return;
    }
    // case 'setProgress': {
    //   const poisInCell = state.pois.poisByCellId[cellId] ?? [];
    //   const poi = poisInCell.find((p) => p.id === poiId);
    //   if (!poi) return;

    //   state.pois.actions.modifyPoiProgress(cellId, poiId, action.value - (poi.progress ?? 0));
    //   return;
    // }

    // ——— статы/навыки персонажа ———
    case 'changeCurrentCellParam': {
      state.map.actions.modifyCellStatus(cellId, action.cellParam as CellProgressKey, action.delta);
      return;
    }
    // case 'changeCellParamInRadius': {
    //   state.map.actions.modifyCellParamInRadius(cellId, action.cellParam, action.delta, action.radius);
    //   return;
    // }
    case 'replaceSelf': {
      const isExisting = state.pois.poisByCellId[cellId]?.some((p) => p.id === poiId);
      if (!isExisting) return;

      state.pois.actions.removePoiFromCell(cellId, poiId);
      state.pois.actions.addPoiToCell(cellId, action.toPoiId);
      return;
    }
    case 'addPoiToCurrentCell': {
      state.pois.actions.addPoiToCell(cellId, action.poiId);
      return;
    }
    case 'addPoisInRadius': {
      state.pois.actions.addPoiInRadius(
        cellId,
        action.poiId,
        action.radius,
        action.perCellChance ?? 1,
      );
      return;
    }
  }
}
