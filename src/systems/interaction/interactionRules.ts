import { getLoyaltyProfile } from '@/data/factionsLoyalty.rules.ts';
import type {
  CharacterEffect,
  CharacterTriggerRule,
  InteractionContext,
  ResolvedTriggerRules,
  WorldEffect,
  WorldTriggerRule,
} from '@/types/effects.types';
import type { InteractionEffectDescriptor } from '@/types/interaction.types';

export function resolveEffectiveRelation(params: {
  factionId: string;
  factionReputation: number;
  personalAffection: number;
}): number {
  const { factionId, factionReputation, personalAffection = 0 } = params;

  const { personalWeight, factionWeight } = getLoyaltyProfile(factionId);
  const effective = personalAffection * personalWeight + factionReputation * factionWeight;

  return effective;
}

export function computeInitialTension(
  effectiveRelation: number,
  random: () => number = Math.random,
): number {
  // [-20..20]
  const randomOffset = Math.floor(random() * 41) - 20;
  return effectiveRelation + randomOffset;
}

export function resolveInteractionEffects(
  effects: InteractionEffectDescriptor[] | undefined,
  context: InteractionContext,
): ResolvedTriggerRules {
  const characters: Record<string, CharacterTriggerRule[]> = {};
  const world: WorldTriggerRule[] = [];

  if (!effects || effects.length === 0) {
    return { characters: {}, world: [] };
  }

  const worldThen: WorldEffect[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'modifySkill':
        pushCharacterRule(characters, context.initiatorId, {
          type: 'modifySkill',
          skill: effect.skill,
          delta: effect.delta,
        });
        break;

      case 'modifyMainStat':
        pushCharacterRule(characters, context.initiatorId, {
          type: 'modifyMainStat',
          stat: effect.stat,
          delta: effect.delta,
        });
        break;

      case 'modifyTargetAffection':
        if (context.targetCharacterId) {
          pushCharacterRule(characters, context.targetCharacterId, {
            type: 'modifyAffection',
            delta: effect.delta,
          });
        }
        break;

      case 'modifyFactionReputation':
        if (context.targetFactionId) {
          worldThen.push({
            type: 'modifyReputation',
            factionId: context.targetFactionId,
            delta: effect.delta,
          });
        }
        break;

      case 'modifyTension':
        worldThen.push({
          type: 'modifyTension',
          delta: effect.delta,
        });
        break;
    }
  }

  if (worldThen.length > 0) {
    world.push({ then: worldThen });
  }

  return { characters, world };
}

function pushCharacterRule(
  acc: Record<string, CharacterTriggerRule[]>,
  characterId: string,
  effect: CharacterEffect,
) {
  if (!acc[characterId]) {
    acc[characterId] = [];
  }
  acc[characterId].push({ then: [effect] });
}
