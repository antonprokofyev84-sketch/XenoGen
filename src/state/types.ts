import type { StateCreator } from 'zustand';
import type { StoreState } from './useGameState';

export type GameSlice<T> = StateCreator<StoreState, [['zustand/immer', never]], [], T>;
