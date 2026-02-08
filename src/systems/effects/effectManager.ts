import { characterDraft } from '@/state/gameSlices/characters';
import { factionsDraft } from '@/state/gameSlices/factions';
import { interactionDraft } from '@/state/gameSlices/interaction';
import type { StoreState } from '@/state/useGameState';
import type {
  CharacterCondition,
  CharacterEffect,
  CharacterEffectCore,
  CharacterTriggerRule,
  EffectLogs,
  PoiCondition,
  PoiEffect,
  PoiEffectCore,
  PoiTriggerRule,
  ResolvedTriggerRules,
  WorldCondition,
  WorldEffect,
  WorldEffectCore,
  WorldTriggerRule,
} from '@/types/effects.types';

const rng = Math.random;

/**
 * Universal EffectManager that processes character, POI, and world effects.
 * Operates directly on the store draft, applying all mutations in place.
 * Returns structured logs of what happened (only includes domains with actual effects).
 */
export const EffectManager = {
  processResolvedEffects(draft: StoreState, resolvedRules: ResolvedTriggerRules): EffectLogs {
    const logs: EffectLogs = {};

    // 1. Process character effects & Collect Logs
    if (resolvedRules.characters) {
      const characterLogs = CharacterEffectSubsystem.process(draft, resolvedRules.characters);
      if (Object.keys(characterLogs).length > 0) {
        logs.characters = characterLogs;
      }
    }

    // 2. Process POI effects & Collect Logs
    if (resolvedRules.pois) {
      const poiLogs = PoiEffectSubsystem.process(draft, resolvedRules.pois);
      if (Object.keys(poiLogs).length > 0) {
        logs.pois = poiLogs;
      }
    }

    // 3. Process world effects & Collect Logs
    if ((resolvedRules.world ?? []).length > 0) {
      const worldLogs = WorldEffectSubsystem.process(draft, resolvedRules.world!);
      if (worldLogs.length > 0) {
        logs.world = worldLogs;
      }
    }

    return logs;
  },
};

// =====================================================================
// CHARACTER EFFECTS SUBSYSTEM
// =====================================================================

const CharacterEffectSubsystem = {
  process(
    draft: StoreState,
    effectsByCharacter: Record<string, CharacterTriggerRule[]>,
  ): Record<string, CharacterEffectCore[]> {
    const logs: Record<string, CharacterEffectCore[]> = {};

    for (const characterId of Object.keys(effectsByCharacter)) {
      const rules = effectsByCharacter[characterId] ?? [];
      const appliedEffects: CharacterEffectCore[] = [];

      for (const rule of rules) {
        if (!evaluateCharacterConditions(rule.when, draft)) continue;

        for (const effect of rule.then ?? []) {
          if (effect.chance !== undefined && rng() > effect.chance) continue;

          // Получаем лог (результат) применения напрямую из драфта
          const result = applyCharacterEffect(draft, effect, characterId);
          if (result) {
            appliedEffects.push(result);
          }
        }
      }

      if (appliedEffects.length > 0) {
        logs[characterId] = appliedEffects;
      }
    }

    return logs;
  },
};

function evaluateCharacterConditions(
  conditions: CharacterCondition[] | undefined,
  _draft: StoreState,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    console.warn('[CharacterCondition] Condition type not fully implemented', condition);
    return true;
  });
}

function applyCharacterEffect(
  draft: StoreState,
  effect: CharacterEffect,
  characterId: string,
): CharacterEffectCore | null {
  switch (effect.type) {
    case 'modifySkill': {
      // Используем возврат из слайса как источник правды для лога
      return characterDraft.changeSkill(draft, characterId, effect.skill, effect.delta);
    }
    case 'modifyMainStat': {
      return characterDraft.changeMainStat(draft, characterId, effect.stat, effect.delta);
    }
    case 'modifyAffection': {
      console.warn(
        `[CharacterEffect] modifyAffection not yet implemented for ${characterId}`,
        effect,
      );
      // Fallback пока функционал не реализован в слайсе
      return { type: 'modifyAffection', delta: effect.delta };
    }
    default:
      console.warn(`[CharacterEffect] Unknown effect type`, effect);
      return null;
  }
}

// =====================================================================
// POI EFFECTS SUBSYSTEM
// =====================================================================

const PoiEffectSubsystem = {
  process(
    draft: StoreState,
    effectsByPoi: Record<string, PoiTriggerRule[]>,
  ): Record<string, PoiEffectCore[]> {
    const logs: Record<string, PoiEffectCore[]> = {};

    for (const poiId of Object.keys(effectsByPoi)) {
      const rules = effectsByPoi[poiId] ?? [];
      const appliedEffects: PoiEffectCore[] = [];

      for (const rule of rules) {
        if (!evaluatePoiConditions(rule.when, draft)) continue;

        for (const effect of rule.then ?? []) {
          if (effect.chance !== undefined && rng() > effect.chance) continue;

          const result = applyPoiEffect(draft, effect, poiId);
          if (result) {
            appliedEffects.push(result);
          }
        }
      }
      if (appliedEffects.length > 0) {
        logs[poiId] = appliedEffects;
      }
    }
    return logs;
  },
};

function evaluatePoiConditions(
  conditions: PoiCondition[] | undefined,
  _draft: StoreState,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    console.warn('[PoiCondition] Condition type not fully implemented', condition);
    return true;
  });
}

function applyPoiEffect(
  _draft: StoreState,
  effect: PoiEffect,
  poiId: string,
): PoiEffectCore | null {
  console.warn(`[PoiEffect] Effect application not yet fully implemented`, { effect, poiId });
  return null;
}

// =====================================================================
// WORLD EFFECTS SUBSYSTEM
// =====================================================================

const WorldEffectSubsystem = {
  process(draft: StoreState, rules: WorldTriggerRule[]): WorldEffectCore[] {
    const logs: WorldEffectCore[] = [];

    for (const rule of rules) {
      if (!evaluateWorldConditions(rule.when, draft)) continue;

      for (const effect of rule.then ?? []) {
        if (effect.chance !== undefined && rng() > effect.chance) continue;

        const result = applyWorldEffect(draft, effect);
        if (result) {
          logs.push(result);
        }
      }
    }
    return logs;
  },
};

function evaluateWorldConditions(
  conditions: WorldCondition[] | undefined,
  _draft: StoreState,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    console.warn('[WorldCondition] Condition type not fully implemented', condition);
    return true;
  });
}

function applyWorldEffect(draft: StoreState, effect: WorldEffect): WorldEffectCore | null {
  switch (effect.type) {
    case 'modifyTension': {
      return interactionDraft.updateTension(draft, effect.delta);
    }
    case 'modifyReputation': {
      const factionId = effect.factionId;
      if (!factionId) {
        console.warn(`[WorldEffect] modifyReputation missing factionId`, effect);
        return null;
      }
      return factionsDraft.changeReputation(draft, factionId, effect.delta);
    }
    default:
      console.warn(`[WorldEffect] Unknown effect type`, effect);
      return null;
  }
}
