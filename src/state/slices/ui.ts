import type { StoreState } from '../useGameState.ts';
import type { GameSlice } from '../types.ts';

export type UIScreen = 'mainMenu' | 'characterCreation';

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
