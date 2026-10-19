import type { PoiTemplateDefinition } from '@/types/poiContent.types';
import type {
  RegionParameterKey,
  RegionParameters,
  ResolvedRegionLevels,
} from '@/types/region.types';
import { REGION_LEVEL_MAX, REGION_LEVEL_MIN, REGION_PARAMETER_KEYS } from '@/types/region.types';
/**
 * Канонический resolver региональных уровней.
 *
 * Это единственное место, где raw-значения клетки превращаются в уровни и где
 * применяются template override и modifier. Торговля, encounters, генерация
 * врагов и прочие потребители используют его результат, а не повторяют расчёт.
 *
 * ```text
 * raw 0..999 → Math.floor(raw / 100) → override либо +modifier → clamp 0..9
 * ```
 */
/** Производный целый уровень `0..9` из raw-значения клетки. */
export function toRegionLevel(rawValue: number): number {
  return Math.floor(rawValue / 100);
}
function clampLevel(level: number): number {
  return Math.min(REGION_LEVEL_MAX, Math.max(REGION_LEVEL_MIN, level));
}
/**
 * Разрешает конечные уровни POI независимо для каждого параметра.
 *
 * Если параметр присутствует и в override, и в modifier, override имеет
 * приоритет, а modifier для этого параметра игнорируется.
 *
 * Вложенный POI разрешает параметры непосредственно от своей root cell и не
 * наследует локальные уровни родительского POI.
 */
export function resolvePoiRegionLevels(
  rootCellParameters: RegionParameters,
  template: Pick<PoiTemplateDefinition, 'regionLevelOverrides' | 'regionLevelModifiers'>,
): ResolvedRegionLevels {
  const resolved = {} as ResolvedRegionLevels;
  for (const key of REGION_PARAMETER_KEYS) {
    resolved[key] = resolveSingleRegionLevel(rootCellParameters, template, key);
  }

  return resolved;
}

function resolveSingleRegionLevel(
  rootCellParameters: RegionParameters,
  template: Pick<PoiTemplateDefinition, 'regionLevelOverrides' | 'regionLevelModifiers'>,
  key: RegionParameterKey,
): number {
  const override = template.regionLevelOverrides?.[key];

  if (override !== undefined) {
    return clampLevel(override);
  }

  const cellLevel = toRegionLevel(rootCellParameters[key]);
  const modifier = template.regionLevelModifiers?.[key] ?? 0;

  return clampLevel(cellLevel + modifier);
}

/** Уровни самой клетки: override и modifier к ней не применяются. */
export function resolveCellRegionLevels(
  rootCellParameters: RegionParameters,
): ResolvedRegionLevels {
  const resolved = {} as ResolvedRegionLevels;

  for (const key of REGION_PARAMETER_KEYS) {
    resolved[key] = clampLevel(toRegionLevel(rootCellParameters[key]));
  }

  return resolved;
}
