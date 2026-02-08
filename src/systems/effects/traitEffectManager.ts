import type { StoreState } from '@/state/useGameState';
import type { MainStatKey, SkillKey } from '@/types/character.types';
import type { EffectLog } from '@/types/logs.types';
import type { Action, Condition, TriggerRule } from '@/types/traits.types';

import { traitsRegistry } from '../traits/traitsRegistry';

type EffectContext = { state: StoreState };

type ActionOutcome = {
  followUps?: TriggerRule[];
  log?: EffectLog;
};

const rng = Math.random;

export const TraitEffectManager = {
  processTraitEffects(
    effectsByCharacter: Record<string, TriggerRule[]>,
    context: EffectContext,
  ): Record<string, EffectLog[]> {
    const allLogs: Record<string, EffectLog[]> = {};

    for (const characterId of Object.keys(effectsByCharacter)) {
      const queue = [...(effectsByCharacter[characterId] ?? [])];
      const charLogs: EffectLog[] = [];

      while (queue.length) {
        const rule = queue.shift()!;
        if (!evaluateTraitConditions(rule.if, characterId, context.state, rng)) continue;

        for (const action of rule.do ?? []) {
          if (action.chance !== undefined && rng() > action.chance) continue;

          const outcome = applyTraitAction(action, characterId, context.state);
          if (!outcome) continue;

          if (outcome.log) {
            charLogs.push(outcome.log);
          }
          if (outcome.followUps?.length) {
            queue.push(...outcome.followUps);
          }
        }
      }

      if (charLogs.length) {
        allLogs[characterId] = charLogs;
      }
    }

    return allLogs;
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
): ActionOutcome | void {
  switch (action.kind) {
    // --- PROGRESS ---
    case 'modifyProgress': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const current = inst.progress ?? 0;
      const lvlCfg = traitsRegistry.resolveLevel(inst.id, inst.level);
      const max = inst.progressMax ?? lvlCfg?.progressMax ?? undefined;

      let next = current + action.delta;
      if (next < 0) next = 0;

      state.traits.actions.modifyTrait(characterId, inst.id, { progress: next });

      let followUps: TriggerRule[] | undefined;
      if (max !== undefined && next >= max) {
        followUps = lvlCfg?.triggers?.onProgressMax;
      }

      return {
        followUps,
        log: {
          type: 'modifyProgress',
          traitId: inst.id,
          delta: action.delta,
          newValue: next,
        },
      };
    }

    case 'setProgress': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const next = Math.max(0, action.value);
      state.traits.actions.modifyTrait(characterId, inst.id, { progress: next });

      const lvlCfg = traitsRegistry.resolveLevel(inst.id, inst.level);
      const max = inst.progressMax ?? lvlCfg?.progressMax ?? undefined;

      let followUps: TriggerRule[] | undefined;
      if (max !== undefined && next >= max) {
        followUps = lvlCfg?.triggers?.onProgressMax;
      }

      return {
        followUps,
        log: {
          type: 'setProgress',
          traitId: inst.id,
          newValue: next,
        },
      };
    }

    case 'setDuration': {
      const exists = state.traits.traitsByCharacterId[characterId]?.some((t) => t.id === action.id);
      if (!exists) return;

      state.traits.actions.modifyTrait(characterId, action.id, { duration: action.value });

      return {
        log: {
          type: 'setDuration',
          traitId: action.id,
          newValue: action.value,
        },
      };
    }

    // --- СТАТЫ / СКИЛЛЫ ---
    case 'modifyMainStat': {
      const statKey = action.stat as MainStatKey;
      const before = state.characters.byId[characterId]?.mainStats?.[statKey] ?? 0;

      state.characters.actions.changeMainStat(characterId, statKey, action.delta);

      const after =
        state.characters.byId[characterId]?.mainStats?.[statKey] ?? before + action.delta;

      return {
        log: {
          type: 'modifyMainStat',
          stat: statKey,
          delta: after - before,
          newValue: after,
        },
      };
    }

    case 'setMainStat': {
      const statKey = action.stat as MainStatKey;
      state.characters.actions.setMainStat(characterId, statKey, action.value);

      const after = state.characters.byId[characterId]?.mainStats?.[statKey] ?? action.value;

      return {
        log: {
          type: 'setMainStat',
          stat: statKey,
          newValue: after,
        },
      };
    }

    case 'modifySkill': {
      const skillKey = action.skill as SkillKey;
      const before = state.characters.byId[characterId]?.skills?.[skillKey] ?? 0;

      state.characters.actions.changeSkill(characterId, skillKey, action.delta);

      const after = state.characters.byId[characterId]?.skills?.[skillKey] ?? before + action.delta;

      return {
        log: {
          type: 'modifySkill',
          skill: skillKey,
          delta: after - before,
          newValue: after,
        },
      };
    }

    case 'setSkill': {
      const skillKey = action.skill as SkillKey;
      state.characters.actions.setSkill(characterId, skillKey, action.value);

      const after = state.characters.byId[characterId]?.skills?.[skillKey] ?? action.value;

      return {
        log: {
          type: 'setSkill',
          skill: skillKey,
          newValue: after,
        },
      };
    }

    // --- ТРЕЙТЫ ---
    case 'addTrait': {
      const ok = state.traits.actions.addTraitToCharacter(characterId, action.id, {
        level: action.params?.level,
      });
      if (!ok) return;

      if (action.params?.duration !== undefined || action.params?.progress !== undefined) {
        state.traits.actions.modifyTrait(characterId, action.id, {
          duration:
            typeof action.params.duration === 'number'
              ? action.params.duration
              : (action.params.duration as any),
          progress: action.params.progress,
        });
      }

      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);

      return {
        log: {
          type: 'addTrait',
          traitId: action.id,
          level: inst?.level ?? 0,
        },
      };
    }

    case 'removeTrait': {
      state.traits.actions.removeTraitFromCharacter(characterId, action.id);

      return {
        log: {
          type: 'removeTrait',
          traitId: action.id,
        },
      };
    }

    case 'replaceTrait': {
      const exists = state.traits.traitsByCharacterId[characterId]?.some((t) => t.id === action.id);
      if (!exists) return;

      state.traits.actions.removeTraitFromCharacter(characterId, action.id);
      state.traits.actions.addTraitToCharacter(characterId, action.toId);

      return {
        log: {
          type: 'replaceTrait',
          fromId: action.id,
          toId: action.toId,
        },
      };
    }

    case 'levelUpTrait': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const maxIdx = traitsRegistry.getMaxLevelIndex(inst.id);
      if (maxIdx === undefined) return;

      const from = inst.level;
      const to = Math.min(inst.level + 1, maxIdx);
      if (to === from) return;

      state.traits.actions.modifyTrait(characterId, inst.id, { level: to });

      return {
        log: {
          type: 'levelUpTrait',
          traitId: inst.id,
          deltaLevel: to - from,
          newLevel: to,
        },
      };
    }

    case 'levelDownTrait': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const from = inst.level;
      const to = Math.max(inst.level - 1, 0);
      if (to === from) return;

      state.traits.actions.modifyTrait(characterId, inst.id, { level: to });

      return {
        log: {
          type: 'levelDownTrait',
          traitId: inst.id,
          deltaLevel: to - from,
          newLevel: to,
        },
      };
    }

    case 'setTraitLevel': {
      const inst = state.traits.traitsByCharacterId[characterId]?.find((t) => t.id === action.id);
      if (!inst) return;

      const maxIdx = traitsRegistry.getMaxLevelIndex(inst.id) ?? 0;
      const clamped = Math.max(0, Math.min(action.level, maxIdx));
      if (clamped === inst.level) return;

      state.traits.actions.modifyTrait(characterId, inst.id, { level: clamped });

      return {
        log: {
          type: 'setTraitLevel',
          traitId: inst.id,
          newLevel: clamped,
        },
      };
    }

    // showToast / emitEvent — можно добавить лог позже, если захочешь
  }
}
