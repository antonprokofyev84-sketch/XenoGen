import type { StoreState } from '@/state/useGameState';

import type { GameSlice } from '../types';

/**
 * Defines the state structure for the player's shelter.
 */
export interface ShelterSlice {
  location: string;
}

/**
 * A selector to get the entire shelter state.
 */
export const shelterSelectors = {
  selectShelter: (state: StoreState) => state.shelter,
  selectShelterLocation: (state: StoreState) => state.shelter.location,
};

/**
 * Creates the slice for managing the player's shelter state.
 */
export const createShelterSlice: GameSlice<ShelterSlice> = (set, get, api) => ({
  location: '3-0',
});
