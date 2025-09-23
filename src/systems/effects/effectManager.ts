import type { StoreState } from '@/state/useGameState';
import type { Action, TriggerRule, Condition } from '@/types/traits.types';

type EffectContext = {
  state: StoreState;
};

export const EffectManager = {
  processEffects(effectsByActor: Record<string, TriggerRule[]>, ctx: EffectContext) {
    const rng = Math.random;

    for (const characterId of Object.keys(effectsByActor)) {
      const rules = effectsByActor[characterId] ?? [];

      for (const rule of rules) {
        if (!evaluateConditions(rule.if, characterId, ctx.state, rng)) continue;
        for (const action of rule.do ?? []) {
          // chance check
          if (action.chance !== undefined && rng() > action.chance) continue;
          applyAction(action, characterId, ctx.state);
        }
      }
    }
  },
};

// === Conditions ===

function evaluateConditions(
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
        const stateVal = state.player.mainStats?.[c.stat as keyof typeof state.player.mainStats];
        return c.comparison === 'gte' ? stateVal >= c.value : stateVal <= c.value;
      }
      default:
        return true;
    }
  });
}

function applyAction(action: Action, characterId: string, state: StoreState) {
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
      if (!state.traits.traitsByCharacterId[characterId].filter((t) => t.id === action.id).length)
        return;
      state.traits.actions.modifyTrait(characterId, action.id, { duration: action.value });
      return;
    }

    // ——— статы/навыки персонажа ———
    case 'modifyMainStat': {
      state.player.actions.changeMainStat(action.stat as any, action.delta);
      return;
    }
    case 'setMainStat': {
      state.player.actions.setMainStat(action.stat as any, action.value);
      return;
    }
    case 'modifySkill': {
      state.player.actions.changeSkill(action.skill as any, action.delta);
      return;
    }
    case 'setSkill': {
      state.player.actions.setSkill(action.skill as any, action.value);
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
      if (!state.traits.traitsByCharacterId[characterId].filter((t) => t.id === action.id).length)
        return;
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
