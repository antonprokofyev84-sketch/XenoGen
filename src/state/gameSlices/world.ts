import { DEFAULT_EXPLORATION_DURATION, STAMINA_RECOVERY_PER_HOUR, START_DATE } from '@/constants';
import { PoiEffectManager } from '@/systems/effects/poiEffectManager';
import { TraitEffectManager } from '@/systems/effects/traitEffectManager';
import { TravelManager } from '@/systems/travel/travelManager';
import { resolveScoutExplorationLevel } from '@/systems/world/scouting';
import { advanceWorldTime } from '@/systems/world/timeProgression';
import type { CombatResult } from '@/types/combat.types';
import type { EffectLog } from '@/types/logs.types';
import type { ToD, Weather } from '@/types/world.types';
import { getNextTimeOfDayStart, resolveTimeOfDay } from '@/utils/timeOfDay';

import type { GameSlice } from '../types';
import { partySelectors } from '../useGameState';
import type { StoreState } from '../useGameState';
import { interactionDraft } from './interaction';
import { occupancyDraft } from './occupancy';
import { partyDraft } from './party';
import { getDaysSinceLastVisit, poiDraft } from './poi';

export interface WorldSlice {
  currentTime: number;
  weather: Weather;
  actions: {
    endBattle: (combatResult: CombatResult) => Record<string, EffectLog[]>;
    endDay: () => void;
    changeTime: (minutes: number) => void;
    scoutCell: (cellId: string, maxRollValue?: number, bonus?: number, duration?: number) => void;
    travelToPoi: (targetPoiId: string) => void;
    restUntilMorning: () => void;
    restForMinutes: (minutes: number) => void;
  };
}

// Селектор для вычисляемого времени суток
export const worldSelectors = {
  selectTimeOfDay: (state: StoreState): ToD => resolveTimeOfDay(state.world.currentTime),
};

function scoutCellDraft(
  state: StoreState,
  cellId: string,
  maxRollValue?: number,
  bonus = 0,
  duration = DEFAULT_EXPLORATION_DURATION,
) {
  const perception = partySelectors.selectHighestEffectiveMainStat('per')(state);
  const explorationLevel = resolveScoutExplorationLevel({
    maxRollValue: maxRollValue ?? perception,
    bonus,
  });

  poiDraft.exploreCell(state, cellId, explorationLevel, duration);
}

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  currentTime: START_DATE,
  weather: 'clear',

  actions: {
    endBattle: (combatResult) => {
      console.log('---');
      console.log(combatResult);
      const stateSnapshot = get();
      const traitEffects = get().traits.actions.processBattleEnd(combatResult.combatStatus);
      const charactersEffectLogs = TraitEffectManager.processTraitEffects(traitEffects, {
        state: stateSnapshot,
      });
      const characterGrowthLogs = get().characters.actions.processBattleEnd(combatResult);

      const mergedLogs: Record<string, EffectLog[]> = {};

      console.log(characterGrowthLogs);
      console.log(charactersEffectLogs);

      const allCharacterIds = new Set([
        ...Object.keys(charactersEffectLogs),
        ...Object.keys(characterGrowthLogs),
      ]);

      allCharacterIds.forEach((id) => {
        mergedLogs[id] = [...(charactersEffectLogs[id] || []), ...(characterGrowthLogs[id] || [])];
      });
      return mergedLogs;
    },
    endDay: () => {
      const stateSnapshot = get();

      const traitEffects = get().traits.actions.processDayEnd();
      const poiEffects = get().poiSlice.actions.processDayPass();

      TraitEffectManager.processTraitEffects(traitEffects, { state: stateSnapshot });
      set((state) => {
        PoiEffectManager.processPoiEffects(poiEffects, { state });
      });
    },

    changeTime: (minutes: number) => {
      const oldTime = get().world.currentTime;
      const { newTime, daysPassed, oldTimeSlotIndex, newTimeSlotIndex } = advanceWorldTime(
        oldTime,
        minutes,
      );

      set((state) => {
        state.world.currentTime = newTime;

        if (oldTimeSlotIndex !== newTimeSlotIndex || daysPassed > 0) {
          occupancyDraft.refreshOccupancy(state);
        }
      });

      if (daysPassed > 0) {
        for (let i = 0; i < daysPassed; i++) {
          get().world.actions.endDay();
        }
      }
    },

    scoutCell: (cellId, maxRollValue, bonus, duration) => {
      set((state) => {
        scoutCellDraft(state, cellId, maxRollValue, bonus, duration);
      });
    },

    travelToPoi: (targetPoiId: string) => {
      const beforeState = get();

      const currentPoiId = beforeState.party.currentPartyPosition;
      const targetPoi = beforeState.poiSlice.pois[targetPoiId];
      if (!targetPoi) throw new Error(`Target POI ${targetPoiId} does not exist`);

      const fallbackCellId = targetPoi.type !== 'cell' ? targetPoi.rootCellId : null;

      const travel = TravelManager.computeTravel(currentPoiId, targetPoiId, beforeState);

      if (!travel.canTravel) {
        console.warn(`cant travel from ${currentPoiId} to ${targetPoiId}`);
        return;
      }

      set((state) => {
        interactionDraft.endInteraction(state);

        poiDraft.processPoiExit(state, currentPoiId, targetPoiId);

        // Party position must move before time advances, because refreshOccupancy
        // uses the current party position as its anchor.
        partyDraft.moveToPoi(state, targetPoiId, travel.staminaCost);
      });

      get().world.actions.changeTime(travel.timeCost);

      set((state) => {
        // here we are getting the target POI again because it might have been removed during changeTime effects
        const targetPoi = state.poiSlice.pois[targetPoiId];

        if (!targetPoi) {
          if (fallbackCellId && state.poiSlice.pois[fallbackCellId]) {
            state.party.currentPartyPosition = fallbackCellId;
          }

          console.error(`Travel target POI was removed during travel: ${targetPoiId}`);
          state.ui.currentScreen = 'strategicMap';
          return;
        }

        const daysPassed = getDaysSinceLastVisit(state, targetPoiId);
        poiDraft.processPoiEnter(state, targetPoiId, daysPassed);

        //TODO potentially we should scout any poi.
        if (targetPoi.type === 'cell' && daysPassed > 0) {
          scoutCellDraft(state, targetPoiId);
        }

        occupancyDraft.populatePoiOccupancy(state, targetPoiId);

        if (targetPoi.type !== 'cell') {
          interactionDraft.startInteraction(state, { poiId: targetPoiId });
        }

        state.ui.currentScreen = targetPoi.type === 'cell' ? 'strategicMap' : 'poiView';
      });
    },

    restForMinutes: (minutes) => {
      get().world.actions.changeTime(minutes);

      const staminaRestored = Math.floor((minutes / 60) * STAMINA_RECOVERY_PER_HOUR);
      get().party.actions.changeStamina(staminaRestored);
    },

    restUntilMorning: () => {
      const state = get();
      const nextMorning = getNextTimeOfDayStart(state.world.currentTime, 'morning');
      const diffMs = nextMorning - state.world.currentTime;
      const diffMinutes = Math.round(diffMs / 60000);

      // Вызываем наш новый, более универсальный экшен
      get().world.actions.restForMinutes(diffMinutes);
    },
  },
});
