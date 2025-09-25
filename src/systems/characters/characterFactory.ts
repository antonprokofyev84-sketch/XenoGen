import { CHARACTER_TEMPLATES_DB } from '@/data/characterTemplates';
import { ARCHETYPES_TEMPLATES_DB, ARCHETYPES_BY_RARITY } from '@/data/archetypeTemplates';
import type {
  CharacterTemplate,
  Rarity,
  TemplateStat,
  MainStats,
  Skills,
  MainStatKey,
  SkillKey,
  BaseStats,
  BaseStatsKey,
} from '@/types/character.types';

/**
 * Normalizes a stat/skill value (number or [base, random] array) into a consistent [base, random] tuple.
 */
const normalizeStat = (value: TemplateStat | undefined): [number, number] => {
  if (value === undefined) return [0, 0];
  if (typeof value === 'number') return [value, 0];
  return value;
};

function mergeBlock<TKeys extends string>(
  base: Partial<Record<TKeys, TemplateStat>> = {},
  arch: Partial<Record<TKeys, TemplateStat>> = {},
) {
  const out: Record<TKeys, number> = {} as any;
  for (const k in base) {
    const [b0, bR] = normalizeStat(base[k]);
    const [a0, aR] = normalizeStat(arch[k]);
    const tR = bR + aR;
    const r = tR ? Math.floor(Math.random() * (tR + 1)) : 0;
    out[k] = b0 + a0 + r;
  }
  return out;
}

/**
 * A factory for creating character "blueprints" based on templates, archetypes, and randomness.
 */
export const CharacterFactory = {
  /**
   * Creates a new character blueprint.
   * @param templateId The ID of the base template (e.g., 'protagonist', 'generic_raider').
   * @param rarity The rarity of the character to generate.
   * @returns A fully assembled Character object or null if the template is not found.
   */
  createCharacter: (templateId: string, rarity: Rarity): CharacterTemplate | null => {
    // 1. Get the base template
    const baseTemplate = CHARACTER_TEMPLATES_DB[templateId];
    if (!baseTemplate) {
      console.error(`Character template with id "${templateId}" not found.`);
      return null;
    }

    // 2. Determine the pool of possible archetypes
    let archetypePool = [];
    if (baseTemplate.archetypesPossible && baseTemplate.archetypesPossible.length > 0) {
      archetypePool = baseTemplate.archetypesPossible;
    } else {
      archetypePool = ARCHETYPES_BY_RARITY[rarity] || [];
    }

    // 3. Select one random archetype
    const selectedArchetypeId = archetypePool[Math.floor(Math.random() * archetypePool.length)];
    const selectedArchetype = ARCHETYPES_TEMPLATES_DB[selectedArchetypeId];
    if (!selectedArchetype) {
      console.warn(`No archetype found for template "${templateId}".`);
    }

    // 4. Merge stats and skills (including randomness)
    const finalMainStats: MainStats = mergeBlock<MainStatKey>(
      baseTemplate.mainStats,
      selectedArchetype?.mainStats,
    ) as MainStats;

    const finalSkills: Skills = mergeBlock<SkillKey>(
      baseTemplate.skills,
      selectedArchetype?.skills,
    ) as Skills;

    const finalBaseStats: BaseStats = mergeBlock<BaseStatsKey>(
      baseTemplate.baseStats,
      selectedArchetype?.baseStats,
    ) as BaseStats;

    // 5. Merge and select traits
    const requiredTraits = new Set([
      ...(baseTemplate.traitsRequired ?? []),
      ...(selectedArchetype?.traitsRequired ?? []),
    ]);

    const possibleTraits = [
      ...(baseTemplate.traitsPossible ?? []),
      ...(selectedArchetype?.traitsPossible ?? []),
    ].filter((id) => !requiredTraits.has(id));

    const numberOfRandomTraits = Math.floor(Math.random() * 4); // 0 to 3
    for (let i = 0; i < numberOfRandomTraits && possibleTraits.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * possibleTraits.length);
      const randomTrait = possibleTraits.splice(randomIndex, 1)[0];
      requiredTraits.add(randomTrait);
    }

    // 6. Create the final character blueprint
    const finalCharacterTemplate = {
      ...baseTemplate,
      id: `${templateId}_${Date.now()}`,
      name: baseTemplate.name,
      baseStats: finalBaseStats, // <-- Используем новые, смерженные baseStats
      mainStats: finalMainStats,
      skills: finalSkills,
      traitsRequired: Array.from(requiredTraits),
    };

    return finalCharacterTemplate;
  },
};
