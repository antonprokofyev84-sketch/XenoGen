import { POI_TEMPLATES_DB } from '@/data/poi.templates';
import type { CellPoiNode, EncounterPoiNode, PoiNode, PoiType } from '@/types/poi.types';
import type { PoiTriggerRule } from '@/types/poi_template.types';

// все стратегии вызываются внутри сеттера состояния, поэтому могут мутировать POI напрямую
// стратегии мошут менять детали POI но не могут добавлять/удалять POI для этого есть эффекты

/**
 * Runtime-контекст для выполнения логики POI.
 * Ничего "умного" — просто всё, что может понадобиться стратегиям.
 */
export interface PoiRuntimeContext {
  partyCellId: string;
}

/**
 * Общий интерфейс стратегии поведения POI.
 * Все методы опциональны — конкретный тип реализует только нужное.
 */
export interface PoiStrategy<TPoi extends PoiNode = PoiNode> {
  onEnter?(poi: TPoi, context?: PoiRuntimeContext): PoiTriggerRule[] | null;
  onDayPass?(poi: TPoi, context?: PoiRuntimeContext): PoiTriggerRule[] | null;
  //   onInteract?(poi: TPoi, context: PoiRuntimeContext): EffectsMap | null;
}

/**
 * ===== Cell strategy =====
 * Поведение ячеек карты.
 */
export const cellStrategy: PoiStrategy<CellPoiNode> = {
  onDayPass(poi) {
    const daysLeft = poi.details.explorationDaysLeft;
    if (daysLeft > 0) {
      poi.details.explorationDaysLeft = Math.max(0, daysLeft - 1);
    }

    return null;
  },
};

/**
 * ===== Encounter strategy =====
 * Поведение энкаунтеров.
 */
export const encounterStrategy: PoiStrategy<EncounterPoiNode> = {
  onDayPass(poi) {
    const effects: PoiTriggerRule[] = [];

    // === 1. Lifetime ticking ===
    const lifetime = poi.details.lifetimeDays;
    if (typeof lifetime === 'number') {
      const next = lifetime - 1;
      poi.details.lifetimeDays = next;

      // === 2. POI "умер" ===
      if (next <= 0) {
        return [
          {
            do: [{ kind: 'removeSelf' }],
          },
        ];
      }
    }

    // === 3. OnDayPass triggers из шаблона ===
    const template = POI_TEMPLATES_DB[poi.details.poiTemplateId];

    const poiLevel = poi.details.level;
    const levelSettings = typeof poiLevel === 'number' ? template.levels?.[poiLevel] : undefined;

    const levelOnDayPass = levelSettings?.triggers?.onDayPass;

    const onDayPass =
      levelOnDayPass !== undefined // можем отключить триггер через null
        ? levelOnDayPass // может быть null или массив
        : template.triggers?.onDayPass;

    if (onDayPass) {
      effects.push(...onDayPass);
    }

    if (effects.length === 0) return null;

    return effects;
  },

  // onEnter(poi, context) {
  //   // например: проверка perception / скрытности
  //   return null;
  // },

  // onInteract(poi, context) {
  //   // например: диалог, атака, торговля
  //   return null;
  // },
};

/**
 * ===== Strategy registry =====
 * Единственное место, где связывается тип POI и его поведение.
 */
export const poiStrategies: Partial<Record<PoiType, PoiStrategy<PoiNode>>> = {
  cell: cellStrategy,
  encounter: encounterStrategy,
};
