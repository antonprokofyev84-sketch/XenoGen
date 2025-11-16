import { TRAIT_TEMPLATES_DB } from '@/data/trait.templates';
import type { ActiveTrait, TraitFields, TraitId, TraitTemplate } from '@/types/traits.types';

const templatesById: Record<string, TraitTemplate> = Object.create(null);
const templatesByTag: Record<string, TraitTemplate[]> = Object.create(null);

for (const template of TRAIT_TEMPLATES_DB) {
  templatesById[template.id] = template;

  // Индексируем теги по нулевому уровню
  const levelZeroTags = template.levels?.[0]?.tags ?? [];
  for (const tag of levelZeroTags) {
    (templatesByTag[tag] ??= []).push(template);
  }
}

export const traitsRegistry = {
  getById(id: string): TraitTemplate | undefined {
    return templatesById[id];
  },

  getByTag(tag: string): TraitTemplate[] {
    return templatesByTag[tag] ?? [];
  },

  getStartingChoices(): TraitTemplate[] {
    return templatesByTag['startingChoice'] ?? [];
  },

  byId: templatesById,
  all: TRAIT_TEMPLATES_DB,

  /** Вернёт конфиг для указанного уровня (fallback на 0-й). */
  resolveLevel(traitId: TraitId, level: number): TraitFields {
    const tpl = templatesById[traitId];
    const idx = level ?? 0;
    return tpl.levels[idx] ?? tpl.levels[0];
  },

  /** Максимальный индекс уровня у трейта. */
  getMaxLevelIndex(traitId: TraitId): number {
    const tpl = templatesById[traitId];

    // уровни идут подряд с 0 и без пропусков
    const keys = Object.keys(tpl.levels).map(Number);
    return keys.length - 1;
  },

  createActiveTrait(traitId: string, level: number = 0): ActiveTrait | null {
    const tpl = templatesById[traitId];
    if (!tpl) return null;

    const lvlConfig = this.resolveLevel(traitId, level);
    if (!lvlConfig) return null;

    return {
      id: traitId,
      level,
      duration: lvlConfig.duration,
      progress: lvlConfig.progress ?? 0,

      category: tpl.category ?? null,
      maxCategoryCount: tpl.maxCategoryCount ?? null,
      progressMax: lvlConfig.progressMax ?? null,
    };
  },
};
