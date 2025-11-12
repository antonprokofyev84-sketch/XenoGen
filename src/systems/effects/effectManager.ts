import type { StoreState } from '@/state/useGameState';
import type { MainStatKey, SkillKey } from '@/types/character.types';
import type { CellProgressKey } from '@/types/map.types';
import type { EffectsMap, PoiAction } from '@/types/poi.types';
import type { Action, Condition, TriggerRule } from '@/types/traits.types';

import { traitsRegistry } from '../traits/traitsRegistry';

type EffectContext = { state: StoreState };

const rng = Math.random;

export const EffectManager = {
  processTraitEffects(effectsByCharacter: Record<string, TriggerRule[]>, context: EffectContext) {
    for (const characterId of Object.keys(effectsByCharacter)) {
      const queue = [...(effectsByCharacter[characterId] ?? [])];

      while (queue.length) {
        const rule = queue.shift()!;
        if (!evaluateTraitConditions(rule.if, characterId, context.state, rng)) continue;

        for (const action of rule.do ?? []) {
          if (action.chance !== undefined && rng() > action.chance) continue;

          const followUps = applyTraitAction(action, characterId, context.state);
          if (followUps && followUps.length) queue.push(...followUps);
        }
      }
    }
  },

  processPoiEffects(effectsByCell: Record<string, EffectsMap>, context: EffectContext) {
    for (const cellId of Object.keys(effectsByCell)) {
      const cellPois = effectsByCell[cellId];
      for (const poiId of Object.keys(cellPois)) {
        const rules = cellPois[poiId] ?? [];
        for (const rule of rules) {
          for (const action of rule.do ?? []) {
            if (action.chance !== undefined && rng() > action.chance) continue;
            applyPoiAction(action, cellId, poiId, context.state);
          }
        }
      }
    }
  },
};

// === Conditions ===

function evaluateTraitConditions(
  conditions: Condition[] | undefined,
  actorId: string,
  state: StoreState,
  rng: () => number,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    switch (condition.kind) {
      // case 'hasTag': — если понадобится, можно вычислять по тэгам активных трейтов/уровней
      case 'hasTrait': {
        const list = state.traits.traitsByCharacterId[actorId] ?? [];
        return list.some((trait) => trait.id === condition.id);
      }
      case 'randomChance': {
        return rng() < condition.chance;
      }
      case 'mainStatCheck': {
        const stateVal = state.characters.byId[actorId]?.mainStats?.[condition.stat as MainStatKey];
        return condition.comparison === 'gte'
          ? (stateVal ?? 0) >= condition.value
          : (stateVal ?? 0) <= condition.value;
      }
      default:
        return true;
    }
  });
}

// === Trait Actions ===

function applyTraitAction(
  action: Action,
  characterId: string,
  state: StoreState,
): TriggerRule[] | void {
  switch (action.kind) {
    case 'modifyProgress': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const current = inst.progress ?? 0;
      const lvlCfg = traitsRegistry.resolveLevel(inst.id, inst.level);
      const max = inst.progressMax ?? lvlCfg?.progressMax ?? undefined;

      let next = current + action.delta;
      if (next < 0) next = 0;

      state.traits.actions.modifyTrait(characterId, inst.id, { progress: next });

      if (max !== undefined && next >= max) {
        const onProgressMax = lvlCfg?.triggers?.onProgressMax;
        return onProgressMax;
      }
      return;
    }

    case 'setProgress': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const value = Math.max(0, action.value);
      state.traits.actions.modifyTrait(characterId, inst.id, { progress: value });

      const lvlCfg = traitsRegistry.resolveLevel(inst.id, inst.level);
      const max = inst.progressMax ?? lvlCfg?.progressMax ?? undefined;
      if (max !== undefined && value >= max) {
        const onProgressMax = lvlCfg?.triggers?.onProgressMax;
        return onProgressMax;
      }
      return;
    }

    case 'setDuration': {
      const exists = state.traits.traitsByCharacterId[characterId]?.some((t) => t.id === action.id);
      if (!exists) return;
      state.traits.actions.modifyTrait(characterId, action.id, { duration: action.value });
      return;
    }

    // ---- персонаж: статы / скиллы ----
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

    // ---- трейты ----
    case 'addTrait': {
      const ok = state.traits.actions.addTraitToCharacter(characterId, action.id, {
        level: action.params?.level,
      });
      if (!ok) return;

      // Если передали ручные оверрайды — применим сразу после добавления
      if (action.params?.duration !== undefined || action.params?.progress !== undefined) {
        state.traits.actions.modifyTrait(characterId, action.id, {
          duration:
            typeof action.params.duration === 'number'
              ? action.params.duration
              : // (поддержка объектной формы, если введёшь)
                (action.params.duration as any),
          progress: action.params.progress,
        });
      }
      return;
    }

    case 'removeTrait': {
      state.traits.actions.removeTraitFromCharacter(characterId, action.id);
      return;
    }

    case 'replaceTrait': {
      const exists = state.traits.traitsByCharacterId[characterId]?.some((t) => t.id === action.id);
      if (!exists) return;
      state.traits.actions.removeTraitFromCharacter(characterId, action.id);
      state.traits.actions.addTraitToCharacter(characterId, action.toId);
      return;
    }

    case 'levelUpTrait': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const maxIdx = traitsRegistry.getMaxLevelIndex(inst.id);
      if (maxIdx === undefined) return;

      const nextLevel = Math.min(inst.level + 1, maxIdx);
      if (nextLevel === inst.level) return;

      state.traits.actions.modifyTrait(characterId, inst.id, { level: nextLevel });
      return;
    }

    case 'levelDownTrait': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const nextLevel = Math.max(inst.level - 1, 0);
      if (nextLevel === inst.level) return;

      state.traits.actions.modifyTrait(characterId, inst.id, { level: nextLevel });
      return;
    }

    case 'setTraitLevel': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const maxIdx = traitsRegistry.getMaxLevelIndex(inst.id) ?? 0;
      const clamped = Math.max(0, Math.min(action.level, maxIdx));

      if (clamped === inst.level) return;
      state.traits.actions.modifyTrait(characterId, inst.id, { level: clamped });
      return;
    }

    // ---- UI / события (заглушки под твои системы) ----
    // case 'showToast': { /* ... */ return; }
    // case 'emitEvent': { /* ... */ return; }
  }
}

// === POI Actions ===

function applyPoiAction(action: PoiAction, cellId: string, poiId: string, state: StoreState) {
  switch (action.kind) {
    case 'modifySelfProgress': {
      const poisInCell = state.pois.poisByCellId[cellId] ?? [];
      const poi = poisInCell.find((p) => p.id === poiId);
      if (!poi) return;
      state.pois.actions.modifyPoiProgress(cellId, poiId, action.delta);
      return;
    }
    case 'changeCurrentCellParam': {
      state.map.actions.modifyCellStatus(cellId, action.cellParam as CellProgressKey, action.delta);
      return;
    }
    case 'replaceSelf': {
      const exists = state.pois.poisByCellId[cellId]?.some((p) => p.id === poiId);
      if (!exists) return;
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
