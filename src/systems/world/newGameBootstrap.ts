import { START_CELL_ID } from '@/data/initial/cells';
import { INITIAL_FACTIONS } from '@/data/initial/factions';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { factionsDraft } from '@/state/gameSlices/factions';
import { npcDraft } from '@/state/gameSlices/npc';
import { occupancyDraft } from '@/state/gameSlices/occupancy';
import { poiDraft } from '@/state/gameSlices/poi';
import { questDraft } from '@/state/gameSlices/quest';
import type { StoreState } from '@/state/useGameState';

/**
 * Сборка мира для новой игры.
 *
 * Отдельный шаг, а не часть экрана создания персонажа.
 * Создание персонажа лишь собирает начальные данные для персонажа,
 * а мир собирается отдельно здесь и в фиксированном порядке зависимостей.
 *
 * фракции -> POI -> NPC -> квесты -> позиция партии -> occupancy
 *
 * Occupancy идёт последним, ей нужны все остальные элементы мира.
 */

export function bootstrapNewGame(state: StoreState): void {
  factionsDraft.initializeFactions(state, INITIAL_FACTIONS);
  poiDraft.initializeWorld(state);
  npcDraft.initializeNpcs(state, INITIAL_NPCS);
  questDraft.initializeQuests(state);

  state.party.previousPartyPosition = null;
  state.party.currentPartyPosition = START_CELL_ID;

  occupancyDraft.refreshOccupancy(state);

  state.ui.currentScreen = 'strategicMap';
}
