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

export type StoreState = {
  player: PlayerSlice;
  ui: UISlice;
  traits: TraitsSlice;
  world: WorldSlice;
};

export const useGameStore = create<StoreState>()(
  immer((set, get, api) => ({
    world: createWorldSlice(set, get, api),
    player: createPlayerSlice(set, get, api),
    ui: createUISlice(set, get, api),
    traits: createTraitsSlice(set, get, api),
  })),
);

export { playerSelectors, traitsSelectors };
