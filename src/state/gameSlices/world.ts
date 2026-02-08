import {
  DEFAULT_EXPLORATION_DURATION,
  DEFAULT_VISIT_DATE,
  STAMINA_RECOVERY_PER_HOUR,
  START_DATE,
} from '@/constants';
import { PoiEffectManager } from '@/systems/effects/poiEffectManager';
import { TraitEffectManager } from '@/systems/effects/traitEffectManager';
import { TravelManager } from '@/systems/travel/travelManager';
import type { CombatResult } from '@/types/combat.types';
import type { EffectLog } from '@/types/logs.types';
import type { ToD, Weather } from '@/types/world.types';
import { diffCalendarDays } from '@/utils/diffCalendarDays';

import type { GameSlice } from '../types';
import { partySelectors } from '../useGameState';
import type { StoreState } from '../useGameState';
import { interactionDraft } from './interaction';
import { partyDraft } from './party';
import { poiDraft } from './poi';

const MORNING_HOUR = 8; // 8:00 AM

export interface WorldSlice {
  currentTime: number;
  weather: Weather;
  actions: {
    endBattle: (combatResult: CombatResult) => Record<string, EffectLog[]>;
    endDay: () => void;
    changeTime: (minutes: number) => void;
    scoutCell: (cellId: string, maxRollValue: number, bonus: number, duration: number) => void;
    travelToPoi: (targetPoiId: string) => void;
    restUntilMorning: () => void;
    restForMinutes: (minutes: number) => void;
  };
}

// Селектор для вычисляемого времени суток
export const worldSelectors = {
  selectTimeOfDay: (state: StoreState): ToD => {
    const hours = new Date(state.world.currentTime).getHours();
    if (hours < 6 || hours >= 20) return 'night';
    if (hours < 12) return 'morning';
    return 'day';
  },
};

function scoutCellDraft(state: StoreState, cellId: string) {
  const perception = partySelectors.selectHighestEffectiveMainStat('per')(state);

  // возможно нужно вять минимальное значение восприятия среди всех членов отряда как минимум
  const explorationLevel = Math.floor(Math.random() * (perception + 1));

  poiDraft.exploreCell(state, cellId, explorationLevel, DEFAULT_EXPLORATION_DURATION);
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
      // This logic remains the same
      console.log(`--- A new day has begun ---`);
      const stateSnapshot = get();

      const traitEffects = get().traits.actions.processDayEnd();
      const poiEffects = get().poiSlice.actions.processDayPass();

      TraitEffectManager.processTraitEffects(traitEffects, { state: stateSnapshot });
      set((state) => {
        PoiEffectManager.processPoiEffects(poiEffects, { state });
      });
    },

    changeTime: (minutes: number) => {
      // This logic remains the same
      const oldTime = get().world.currentTime;
      const newTime = oldTime + minutes * 60 * 1000;
      const oldDay = new Date(oldTime).getDate();
      const newDay = new Date(newTime).getDate();
      const daysPassed = newDay - oldDay;

      set((state) => {
        state.world.currentTime = newTime;
      });

      if (daysPassed > 0) {
        for (let i = 0; i < daysPassed; i++) {
          get().world.actions.endDay();
        }
      }
    },

    scoutCell: (cellId) => {
      set((state) => {
        scoutCellDraft(state, cellId);
      });
    },

    travelToPoi: (targetPoiId: string) => {
      const beforeState = get();

      const currentPoiId = beforeState.party.currentPartyPosition;
      const targetPoi = beforeState.poiSlice.pois[targetPoiId];
      if (!targetPoi) throw new Error(`Target POI ${targetPoiId} does not exist`);

      const currentTime = beforeState.world.currentTime;
      const lastVisitTime = targetPoi.details.lastTimeVisited ?? DEFAULT_VISIT_DATE;
      const daysPassed = diffCalendarDays(lastVisitTime, currentTime);

      const travel = TravelManager.computeTravel(currentPoiId, targetPoiId, beforeState);

      if (!travel.canTravel) {
        console.warn(`cant travel from ${currentPoiId} to ${targetPoiId}`);
        return;
      }

      beforeState.world.actions.changeTime(travel.timeCost);

      set((state) => {
        const poi = state.poiSlice.pois[targetPoiId];
        if (!poi) return;

        poiDraft.processPoiEnter(state, targetPoiId, daysPassed, state.world.currentTime);
        if (poi.type === 'cell' && daysPassed > 0) {
          scoutCellDraft(state, targetPoiId);
        }
        partyDraft.moveToPoi(state, targetPoiId, travel.staminaCost);
        interactionDraft.startInteraction(state, { poiId: targetPoiId });
        state.ui.currentScreen = poi.type === 'cell' ? 'strategicMap' : 'poiView';
      });
    },

    restForMinutes: (minutes) => {
      console.log('Resting for minutes:', minutes);
      get().world.actions.changeTime(minutes);

      const staminaRestored = Math.floor((minutes / 60) * STAMINA_RECOVERY_PER_HOUR);
      get().party.actions.changeStamina(staminaRestored);
    },

    restUntilMorning: () => {
      const state = get();
      const currentDate = new Date(state.world.currentTime);

      const nextMorning = new Date(currentDate);
      nextMorning.setDate(currentDate.getDate() + 1);
      nextMorning.setHours(MORNING_HOUR, 0, 0, 0);

      const diffMs = nextMorning.getTime() - currentDate.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      // Вызываем наш новый, более универсальный экшен
      get().world.actions.restForMinutes(diffMinutes);
    },
  },
});
