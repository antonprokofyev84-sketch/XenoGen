import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createPlayerSlice, playerSelectors } from './slices/player';
import type { PlayerSlice } from './slices/player';

import { createUISlice } from './slices/ui';
import type { UISlice } from './slices/ui';

import { createTraitsSlice, traitsSelectors } from './slices/traits';
import type { TraitsSlice } from './slices/traits';

import { createWorldSlice } from '@/state/slices/world';
import type { WorldSlice } from '@/state/slices/world';

import { createMapSlice, mapSelectors } from '@/state/slices/map';
import type { MapSlice } from '@/state/slices/map';

export type StoreState = {
  player: PlayerSlice;
  ui: UISlice;
  traits: TraitsSlice;
  world: WorldSlice;
  map: MapSlice;
};

export const useGameStore = create<StoreState>()(
  immer((set, get, api) => ({
    world: createWorldSlice(set, get, api),
    player: createPlayerSlice(set, get, api),
    ui: createUISlice(set, get, api),
    traits: createTraitsSlice(set, get, api),
    map: createMapSlice(set, get, api),
  })),
);

export { playerSelectors, traitsSelectors, mapSelectors };
