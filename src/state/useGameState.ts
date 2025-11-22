import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createMapSlice, mapSelectors } from '@/state/gameSlices/map';
import type { MapSlice } from '@/state/gameSlices/map';
import { createWorldSlice, worldSelectors } from '@/state/gameSlices/world';
import type { WorldSlice } from '@/state/gameSlices/world';

import { characterSelectors, createCharactersSlice } from './gameSlices/characters';
import type { CharactersSlice } from './gameSlices/characters';
import { createEquipmentSlice, equipmentSelectors } from './gameSlices/equipment';
import type { EquipmentSlice } from './gameSlices/equipment';
import { createFactionsSlice, factionsSelectors } from './gameSlices/factions';
import type { FactionsSlice } from './gameSlices/factions';
import { createInventorySlice, inventorySelectors } from './gameSlices/inventory';
import type { InventorySlice } from './gameSlices/inventory';
import { createPartySlice, partySelectors } from './gameSlices/party';
import type { PartySlice } from './gameSlices/party';
import { createPoiSlice, poiSelectors } from './gameSlices/poi';
import type { PoiSlice } from './gameSlices/poi';
import { createShelterSlice, shelterSelectors } from './gameSlices/shelter';
import type { ShelterSlice } from './gameSlices/shelter';
import { createTraitsSlice, traitsSelectors } from './gameSlices/traits';
import type { TraitsSlice } from './gameSlices/traits';
import { createUISlice } from './gameSlices/ui';
import type { UISlice } from './gameSlices/ui';

export type StoreState = {
  characters: CharactersSlice;
  ui: UISlice;
  traits: TraitsSlice;
  world: WorldSlice;
  map: MapSlice;
  party: PartySlice;
  shelter: ShelterSlice;
  pois: PoiSlice;
  factions: FactionsSlice;
  equipment: EquipmentSlice;
  inventory: InventorySlice;
};

export const useGameState = create<StoreState>()(
  immer((set, get, api) => ({
    world: createWorldSlice(set, get, api),
    ui: createUISlice(set, get, api),
    traits: createTraitsSlice(set, get, api),
    equipment: createEquipmentSlice(set, get, api),
    map: createMapSlice(set, get, api),
    characters: createCharactersSlice(set, get, api),
    party: createPartySlice(set, get, api),
    shelter: createShelterSlice(set, get, api),
    pois: createPoiSlice(set, get, api),
    factions: createFactionsSlice(set, get, api),
    inventory: createInventorySlice(set, get, api),
  })),
);

export {
  traitsSelectors,
  equipmentSelectors,
  mapSelectors,
  characterSelectors,
  partySelectors,
  shelterSelectors,
  poiSelectors,
  factionsSelectors,
  worldSelectors,
  inventorySelectors,
};
