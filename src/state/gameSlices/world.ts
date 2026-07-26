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
import { characterDraft } from './characters';
import { interactionDraft } from './interaction';
import { occupancyDraft } from './occupancy';
import { partyDraft } from './party';
import { getDaysSinceLastVisit, poiDraft } from './poi';
import { traitsDraft } from './traits';

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

/**
 * Runs a single "day passed" tick on the draft: collects trait + POI day-pass
 * effects and applies them in place. No nested set() — safe to compose inside a
 * larger transaction (e.g. time advance during travel).
 */
function runDayTickDraft(state: StoreState) {
  const traitEffects = traitsDraft.collectDayPassEffects(state);
  const poiEffects = poiDraft.collectDayPassEffects(state);

  TraitEffectManager.processTraitEffects(traitEffects, { state });
  PoiEffectManager.processPoiEffects(poiEffects, { state });
}

/**
 * Advances world time on the draft, refreshing occupancy on timeslot/day change
 * and running one day tick per crossed day boundary. Fully atomic.
 */
function advanceTimeDraft(state: StoreState, minutes: number) {
  const { newTime, daysPassed, oldTimeSlotIndex, newTimeSlotIndex } = advanceWorldTime(
    state.world.currentTime,
    minutes,
  );

  state.world.currentTime = newTime;

  if (oldTimeSlotIndex !== newTimeSlotIndex || daysPassed > 0) {
    occupancyDraft.refreshOccupancy(state);
  }

  for (let i = 0; i < daysPassed; i++) {
    runDayTickDraft(state);
  }
}

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  currentTime: START_DATE,
  weather: 'clear',

  actions: {
    endBattle: (combatResult) => {
      const mergedLogs: Record<string, EffectLog[]> = {};

      set((state) => {
        const traitEffects = traitsDraft.collectBattleEndEffects(state, combatResult.combatStatus);
        const charactersEffectLogs = TraitEffectManager.processTraitEffects(traitEffects, {
          state,
        });
        const characterGrowthLogs = characterDraft.processBattleEnd(state, combatResult);

        const allCharacterIds = new Set([
          ...Object.keys(charactersEffectLogs),
          ...Object.keys(characterGrowthLogs),
        ]);

        allCharacterIds.forEach((id) => {
          mergedLogs[id] = [
            ...(charactersEffectLogs[id] || []),
            ...(characterGrowthLogs[id] || []),
          ];
        });
      });

      return mergedLogs;
    },
    endDay: () => {
      set((state) => {
        runDayTickDraft(state);
      });
    },

    changeTime: (minutes: number) => {
      set((state) => {
        advanceTimeDraft(state, minutes);
      });
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

      // The whole trip is one atomic transaction: exit -> move -> time passes
      // (may trigger day ticks / POI removal) -> arrive.
      set((state) => {
        interactionDraft.endInteraction(state);

        poiDraft.processPoiExit(state, currentPoiId, targetPoiId);

        // Party position must move before time advances, because refreshOccupancy
        // uses the current party position as its anchor.
        partyDraft.moveToPoi(state, targetPoiId, travel.staminaCost);

        advanceTimeDraft(state, travel.timeCost);

        // Re-read the target: time advance effects may have removed it.
        const arrivedPoi = state.poiSlice.pois[targetPoiId];

        if (!arrivedPoi) {
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
        if (arrivedPoi.type === 'cell' && daysPassed > 0) {
          scoutCellDraft(state, targetPoiId);
        }

        occupancyDraft.populatePoiOccupancy(state, targetPoiId);

        if (arrivedPoi.type !== 'cell') {
          interactionDraft.startInteraction(state, { poiId: targetPoiId });
        }

        state.ui.currentScreen = arrivedPoi.type === 'cell' ? 'strategicMap' : 'poiView';
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
