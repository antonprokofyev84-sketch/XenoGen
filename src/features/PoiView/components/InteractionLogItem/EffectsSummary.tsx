import { useMemo } from 'react';

import textData from '@/locales/en.json';
import { useGameState } from '@/state/useGameState';
import type { CharacterEffectCore, EffectLogs, WorldEffectCore } from '@/types/effects.types';

import './EffectsSummary.scss';

interface EffectsSummaryProps {
  effects?: EffectLogs;
}

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `${delta}`);

const getSkillLabel = (skillKey: string) => {
  // @ts-ignore
  return textData.skills?.[skillKey] || skillKey;
};

const getMainStatLabel = (statKey: string) => {
  // @ts-ignore
  return textData.mainStats?.[statKey] || statKey;
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

export const EffectsSummary = ({ effects }: EffectsSummaryProps) => {
  const charactersById = useGameState((state) => state.characters.byId);
  const protagonistId = useGameState((state) => state.characters.protagonistId);
  console.log(protagonistId);

  const summaryItems = useMemo(() => {
    if (!effects) return [] as string[];

    const items: string[] = [];

    if (effects.characters) {
      for (const [characterId, characterEffects] of Object.entries(effects.characters)) {
        const character = charactersById[characterId];
        console.log(characterId);
        const characterName = character?.name || 'NPC';
        const isProtagonist = characterId === protagonistId;

        for (const effect of characterEffects) {
          const label = buildCharacterEffectLabel(effect, isProtagonist, characterName);
          if (label) items.push(label);
        }
      }
    }

    if (effects.world) {
      for (const effect of effects.world) {
        const label = buildWorldEffectLabel(effect);
        if (label) items.push(label);
      }
    }

    return items;
  }, [charactersById, effects, protagonistId]);

  if (!summaryItems.length) return null;

  return <div className="effectsSummary">{summaryItems.join(', ')}</div>;
};
