import { create } from 'zustand';

interface MapInteractionState {
  focusedPoiId: string | null;

  actions: {
    setFocusedPoiId: (id: string | null) => void;
    reset: () => void;
  };
}

export const useMapInteractionStore = create<MapInteractionState>((set) => ({
  focusedPoiId: null,

  actions: {
    setFocusedPoiId: (id) => set({ focusedPoiId: id }),

    reset: () => set({ focusedPoiId: null }),
  },
}));
