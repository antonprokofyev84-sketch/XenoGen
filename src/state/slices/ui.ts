import type { GameSlice } from '../types.ts';
import type { StoreState } from '../useGameState.ts';

export type UIScreen = 'mainMenu' | 'characterCreation' | 'strategicMap' | 'combat';

export interface UISlice {
  currentScreen: UIScreen;
  goToScreen: (screen: UIScreen) => void;
}

export const createUISlice: GameSlice<UISlice> = (set) => ({
  currentScreen: 'mainMenu',
  goToScreen: (screen) =>
    set((state) => {
      state.ui.currentScreen = screen;
    }),
});

export const uiSelector = (state: StoreState) => state.ui;
