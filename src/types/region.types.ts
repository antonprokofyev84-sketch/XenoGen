/**
 * Региональные параметры мира.
 *
 * Клетка хранит raw-значения `0..999`, которые могут быть дробными.
 * Игровые системы работают с производными целыми уровнями `0..9`.
 * Единственное место, где одно превращается в другое, — канонический
 * resolver уровней POI.
 */

export type RegionParameterKey = 'prosperity' | 'techLevel' | 'contamination' | 'threat';

/** Полный набор raw-значений клетки; числа `0..999`, допускаются дробные. */
export type RegionParameters = Record<RegionParameterKey, number>;

/** Частичный набор целых уровней либо целых дельт уровня. */
export type RegionLevels = Partial<Record<RegionParameterKey, number>>;

/** Разрешённые конечные уровни POI: всегда целые `0..9` для каждого параметра. */
export type ResolvedRegionLevels = Record<RegionParameterKey, number>;

export const REGION_PARAMETER_KEYS: readonly RegionParameterKey[] = [
  'prosperity',
  'techLevel',
  'contamination',
  'threat',
];

/** Нижняя и верхняя границы raw-значения клетки. */
export const REGION_RAW_MIN = 0;
export const REGION_RAW_MAX = 999;

/** Нижняя и верхняя границы производного уровня. */
export const REGION_LEVEL_MIN = 0;
export const REGION_LEVEL_MAX = 9;

/**
 * Ежедневное изменение raw-значения региона у root cell владеющего POI.
 *
 * `delta` меняет raw-значение, а не уровень, и может быть дробным.
 * `min`/`max` — границы влияния конкретного эффекта: они насыщают изменение
 * на границе, но не возвращают уже вышедшее за неё значение обратно.
 */
export interface ChangeRegionParameterEffect {
  type: 'changeRegionParameter';
  cellParam: RegionParameterKey;
  delta: number;

  /** Независимая вероятность `0..1`; отсутствие означает `1`. */
  chance?: number;
  /** Нижняя граница влияния эффекта; отсутствие означает `REGION_RAW_MIN`. */
  min?: number;
  /** Верхняя граница влияния эффекта; отсутствие означает `REGION_RAW_MAX`. */
  max?: number;
}
