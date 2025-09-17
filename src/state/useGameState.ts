import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createPlayerSlice, playerSelectors } from './slices/player';
import type { PlayerSlice } from './slices/player';

import { createUISlice } from './slices/ui';
import type { UISlice } from './slices/ui';

import { createTraitsSlice } from './slices/traits';
import type { TraitsSlice } from './slices/traits';

export type StoreState = { player: PlayerSlice; ui: UISlice; traits: TraitsSlice };

export const useGameStore = create<StoreState>()(
  immer((set, get, api) => ({
    player: createPlayerSlice(set, get, api),
    ui: createUISlice(set, get, api),
    traits: createTraitsSlice(set, get, api),
  })),
);

export { playerSelectors };
