import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import { INITIAL_FACTIONS } from '@/data/initial/factions';
import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import type { InitialDataBundle, ReferenceIdSets } from '@/systems/validation/validateInitialData';

import { INITIAL_ACTIONS } from './actions';
import { INITIAL_CELLS } from './cells';
import { INITIAL_FRAMES } from './frames';
import { INITIAL_INTERCEPTORS } from './interceptors';
import { INITIAL_NPCS } from './npcs';
import { POI_TEMPLATES } from './poiTemplates';
import { INITIAL_POIS_BY_CELL } from './pois';
import { INITIAL_QUESTS } from './quests';

/**
 * Собирает все initial-реестры в один набор для development-валидатора.
 *
 * Справочники предметов, фракций и типов врагов передаются множествами ID,
 * поэтому валидатор не зависит от их внутренней формы.
 */
export function createReferenceIdSets(): ReferenceIdSets {
  return {
    itemIds: new Set(Object.keys(ITEMS_TEMPLATES_DB)),
    factionIds: new Set(Object.keys(INITIAL_FACTIONS)),
    enemyTypeIds: new Set(Object.keys(ENEMY_TEMPLATES_DB)),
  };
}

export function createInitialDataBundle(): InitialDataBundle {
  return {
    cells: INITIAL_CELLS,
    poisByCell: INITIAL_POIS_BY_CELL,
    poiTemplates: POI_TEMPLATES,
    npcs: INITIAL_NPCS,
    frames: INITIAL_FRAMES,
    actions: INITIAL_ACTIONS,
    interceptors: INITIAL_INTERCEPTORS,
    quests: INITIAL_QUESTS,
    references: createReferenceIdSets(),
  };
}
