import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import { STAMINA_RECOVERY_PER_HOUR } from '@/constants';
import { EffectManager } from '@/systems/effects/effectManager';
import { TravelManager } from '@/systems/travel/travelManager';
import type { CombatStatus } from '@/types/combat.types';
import type { ToD, Weather } from '@/types/world.types';

import type { GameSlice } from '../types';
import { partySelectors } from '../useGameState';
import type { StoreState } from '../useGameState';

const MORNING_HOUR = 8; // 8:00 AM

export interface WorldSlice {
  currentTime: number;
  weather: Weather;
  actions: {
    endBattle: (combatResult: CombatStatus) => void;
    endDay: () => void;
    changeTime: (minutes: number) => void;
    scoutCell: (cellId: string, maxRollValue: number, bonus: number, duration: number) => void;
    travelToCell: (targetCellId: string) => void;
    restUntilMorning: () => void;
    restForMinutes: (minutes: number) => void; // <-- 1. Новый, более универсальный экшен
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

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  currentTime: new Date('2069-05-10T08:00:00').getTime(),
  weather: 'clear',

  actions: {
    endBattle: (combatResult) => {
      const stateSnapshot = get();
      const traitEffects = get().traits.actions.processBattleEnd(combatResult);
      EffectManager.processTraitEffects(traitEffects, { state: stateSnapshot });
    },
    endDay: () => {
      // This logic remains the same
      console.log(`--- A new day has begun ---`);
      const stateSnapshot = get();
      const traitEffects = get().traits.actions.processDayEnd();
      get().map.actions.processDayEnd();
      const poiEffects = get().pois.actions.processDayEnd();
      EffectManager.processTraitEffects(traitEffects, { state: stateSnapshot });
      EffectManager.processPoiEffects(poiEffects, { state: stateSnapshot });
    },

    changeTime: (minutes: number) => {
      // This logic remains the same
      const oldTime = get().world.currentTime;
      const newTime = oldTime + minutes * 60 * 1000;
      const oldDay = new Date(oldTime).getDate();
      const newDay = new Date(newTime).getDate();

      set((state) => {
        state.world.currentTime = newTime;
      });

      const daysPassed = newDay - oldDay;
      if (daysPassed > 0) {
        for (let i = 0; i < daysPassed; i++) {
          get().world.actions.endDay();
        }
      }
    },

    scoutCell: (cellId, maxRollValue, bonus, duration) => {
      // This logic remains the same
      const roll = Math.floor(Math.random() * (maxRollValue + 1));
      const explorationLevel = roll + bonus;
      get().map.actions.exploreCell(cellId, explorationLevel, duration);
    },

    travelToCell: (targetCellId: string) => {
      // This logic remains the same
      const state = get();
      const currentCellId = state.party.currentPartyPosition;
      const targetCell = state.map.cells[targetCellId];
      if (!targetCell) return;

      const cost = TravelManager.computeTravelCost({
        currentCellId,
        targetCellId,
        terrain: targetCell.type,
        weather: state.world.weather,
        timeOfDay: worldSelectors.selectTimeOfDay(state),
        mode: state.party.travelMode,
        isFatigued: partySelectors.selectIsPartyFatigued(state),
      });

      if (!cost.passable) {
        console.warn('Travel failed: terrain is impassable.');
        return;
      }

      get().world.actions.changeTime(cost.minutes);
      get().party.actions.changeStamina(-cost.stamina);

      set((draftState) => {
        draftState.party.currentPartyPosition = targetCellId;
      });

      const selectedStat = partySelectors.selectHighestEffectiveMainStat('per')(get());
      get().world.actions.scoutCell(targetCellId, selectedStat, 0, DEFAULT_EXPLORATION_DURATION);
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
