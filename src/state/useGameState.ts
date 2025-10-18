import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createMapSlice, mapSelectors } from '@/state/slices/map';
import type { MapSlice } from '@/state/slices/map';
import { createWorldSlice, worldSelectors } from '@/state/slices/world';
import type { WorldSlice } from '@/state/slices/world';

import { characterSelectors, createCharactersSlice } from './slices/characters';
import type { CharactersSlice } from './slices/characters';
import { createEquipmentSlice, equipmentSelectors } from './slices/equipment';
import type { EquipmentSlice } from './slices/equipment';
import { createFactionsSlice, factionsSelectors } from './slices/factions';
import type { FactionsSlice } from './slices/factions';
import { createPartySlice, partySelectors } from './slices/party';
import type { PartySlice } from './slices/party';
import { createPoiSlice, poiSelectors } from './slices/poi';
import type { PoiSlice } from './slices/poi';
import { createShelterSlice, shelterSelectors } from './slices/shelter';
import type { ShelterSlice } from './slices/shelter';
import { createTraitsSlice, traitsSelectors } from './slices/traits';
import type { TraitsSlice } from './slices/traits';
import { createUISlice } from './slices/ui';
import type { UISlice } from './slices/ui';

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
};

export const useGameStore = create<StoreState>()(
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
};
