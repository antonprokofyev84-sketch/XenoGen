import textData from '@/locales/en.json';
import type { StoreState } from '@/state/useGameState';
import type { CharacterEffectCore, EffectLogs, WorldEffectCore } from '@/types/effects.types';

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `${delta}`);

const getSkillLabel = (skillKey: string) => {
  return textData.skills?.[skillKey as keyof typeof textData.skills] || skillKey;
};

const getMainStatLabel = (statKey: string) => {
  return textData.mainStats?.[statKey as keyof typeof textData.mainStats] || statKey;
};

const buildCharacterEffectLabel = (
  effect: CharacterEffectCore,
  isProtagonist: boolean,
  characterName: string,
) => {
  const namePrefix = isProtagonist ? 'Your ' : `${characterName} `;

  if (effect.type === 'modifySkill') {
    return `${namePrefix}${getSkillLabel(effect.skill)} (${formatDelta(effect.delta)})`;
  }

  if (effect.type === 'modifyMainStat') {
    return `${namePrefix}${getMainStatLabel(effect.stat)} (${formatDelta(effect.delta)})`;
  }

  if (effect.type === 'modifyAffection') {
    return `${characterName} affection (${formatDelta(effect.delta)})`;
  }

  return null;
};

const buildWorldEffectLabel = (effect: WorldEffectCore) => {
  if (effect.type === 'modifyTension') {
    return `Tension (${formatDelta(effect.delta)})`;
  }

  if (effect.type === 'modifyReputation') {
    const factionLabel = effect.factionId ? `${effect.factionId} reputation` : 'Reputation';
    return `${factionLabel} (${formatDelta(effect.delta)})`;
  }

  return null;
};

export const resolveEffectSummaryItems = (state: StoreState, effects?: EffectLogs): string[] => {
  if (!effects) return [];

  const summaryItems: string[] = [];
  const charactersById = state.characters.byId;
  const protagonistId = state.characters.protagonistId;

  if (effects.characters) {
    for (const [characterId, characterEffects] of Object.entries(effects.characters)) {
      const character = charactersById[characterId];
      const characterName = character?.name || 'NPC';
      const isProtagonist = characterId === protagonistId;

      for (const effect of characterEffects) {
        const label = buildCharacterEffectLabel(effect, isProtagonist, characterName);
        if (label) summaryItems.push(label);
      }
    }
  }

  if (effects.world) {
    for (const effect of effects.world) {
      const label = buildWorldEffectLabel(effect);
      if (label) summaryItems.push(label);
    }
  }

  return summaryItems;
};
