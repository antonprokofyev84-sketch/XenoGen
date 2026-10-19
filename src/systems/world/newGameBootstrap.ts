import { START_CELL_ID } from '@/data/initial/cells';
import { INITIAL_FACTIONS } from '@/data/initial/factions';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { factionsDraft } from '@/state/gameSlices/factions';
import { npcDraft } from '@/state/gameSlices/npc';
import { occupancyDraft } from '@/state/gameSlices/occupancy';
import { poiDraft } from '@/state/gameSlices/poi';
import { questsDraft } from '@/state/gameSlices/quests';
import type { StoreState } from '@/state/useGameState';

/**
 * Сборка мира для новой игры.
 *
 * Отдельный шаг, а не часть экрана создания персонажа.
 * Сщздание персонажа лишь собирает начальные данные для персонажа,
 * а мир собирается отдельно здесь и в фиксированном порядке зависимостей.
 *
 * фракции -> POI -> NPC -> квесты -> позиция партии -> occupancy
 *
 * Occupancy идет последним, ей нужды все остальные элементы мира.
 */

export function bootstrapNewGame(state: StoreState): void {
  factionsDraft.initializeFactions(state, INITIAL_FACTIONS);
  poiDraft.initializePois(state);
  npcDraft.initializeNpcs(state, INITIAL_NPCS);
  questsDraft.initializeQuests(state);

  state.party.previousPartyPosition = null;
  state.party.currentPartyPosition = START_CELL_ID;

  occupancyDraft.initializeOccupancy(state);

  state.ui.currentScreen = 'strategicMap';
}
