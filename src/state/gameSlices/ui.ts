import { rollVisibleAppearanceChances } from '@/systems/interaction/actionSources';

import type { GameSlice } from '../types.ts';
import type { StoreState } from '../useGameState.ts';

export type UIScreen =
  | 'mainMenu'
  | 'characterCreation'
  | 'strategicMap'
  | 'poiView'
  | 'combat'
  | 'characterDetails';

export interface UISlice {
  currentScreen: UIScreen;
  characterDetailsReturnScreen: UIScreen;
  isLocationHudCollapsed: boolean;
  toggleLocationHud: () => void;
  openCharacterDetails: () => void;
  closeCharacterDetails: () => void;
  goToScreen: (screen: UIScreen) => void;
}

export const createUISlice: GameSlice<UISlice> = (set) => ({
  currentScreen: 'mainMenu',
  characterDetailsReturnScreen: 'strategicMap',
  isLocationHudCollapsed: false,
  toggleLocationHud: () =>
    set((state) => {
      state.ui.isLocationHudCollapsed = !state.ui.isLocationHudCollapsed;
    }),
  openCharacterDetails: () =>
    set((state) => {
      if (state.ui.currentScreen === 'characterDetails') return;
      state.ui.characterDetailsReturnScreen = state.ui.currentScreen;
      state.ui.currentScreen = 'characterDetails';
    }),
  closeCharacterDetails: () =>
    set((state) => {
      state.ui.currentScreen = state.ui.characterDetailsReturnScreen;
      if (
        state.ui.currentScreen === 'poiView' &&
        !state.interactionSlice.currentInteraction?.currentEntry
      ) {
        rollVisibleAppearanceChances(state);
      }
    }),
  goToScreen: (screen) =>
    set((state) => {
      if (screen === 'characterDetails' && state.ui.currentScreen !== screen) {
        state.ui.characterDetailsReturnScreen = state.ui.currentScreen;
      }
      state.ui.currentScreen = screen;
    }),
});

export const uiSelector = (state: StoreState) => state.ui;
