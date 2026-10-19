import { DEFAULT_EXPLORATION_DURATION, STAMINA_RECOVERY_PER_HOUR, START_DATE } from '@/constants';
import { applyEffects } from '@/systems/effects/applyEffects';
import { TraitEffectManager } from '@/systems/effects/traitEffectManager';
import { clearDailyInteractionMemory } from '@/systems/interaction/dailyMemory';
import {
  endInteraction,
  enterPoiContext,
  refreshInteractionForTimeSlot,
} from '@/systems/interaction/interactionState';
import { TravelManager } from '@/systems/travel/travelManager';
import { bootstrapNewGame } from '@/systems/world/newGameBootstrap';
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
import { occupancyDraft } from './occupancy';
import { partyDraft } from './party';
import { getDaysSinceLastVisit, poiDraft } from './poi';
import { questDraft } from './quest';
import { traitsDraft } from './traits';

export interface WorldSlice {
  currentTime: number;
  weather: Weather;
  actions: {
    /** Собирает мир новой игры и запускает её одной транзакцией. */
    startNewGame: () => void;
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
 * effects and applies them in place. No nested set() – safe to compose inside a
 * larger transaction (e.g. time advance during travel).
 */
/**
 * Один дневной тик на draft.
 *
 * Порядок зафиксирован контрактом и выполняется для каждой пересечённой
 * границы календарного дня:
 *
 * 1. дневные эффекты POI и сроки жизни;
 * 2. квестовые таймеры и собранные ими effects;
 * 3. единый проход удаления помеченных POI;
 * 4. очистка дневной памяти Actions и Interceptors.
 *
 * Удаление идёт после таймеров намеренно: их effects ещё могут пометить POI.
 * Вложенных `set` здесь нет — весь тик остаётся одной транзакцией.
 */
function runDayTickDraft(state: StoreState) {
  const traitEffects = traitsDraft.collectDayPassEffects(state);
  TraitEffectManager.processTraitEffects(traitEffects, { state });

  poiDraft.runDayPass(state);

  // Собранные таймерами effects исполняются после обоих проходов сразу целиком
  // и до прохода удаления: они ещё могут пометить POI.
  applyEffects(state, questDraft.collectTimerEffects(state));

  poiDraft.sweepPendingRemovals(state);

  // Дневная память очищается целиком, в том числе при активном взаимодействии.
  clearDailyInteractionMemory(state);
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

  for (let i = 0; i < daysPassed; i++) {
    runDayTickDraft(state);
  }

  // Occupancy разрешается однократно и только для конечного time slot: промежуточные
  // раскладки игрок не видит, а дневные тики до этого момента могли удалить POI.
  if (oldTimeSlotIndex !== newTimeSlotIndex || daysPassed > 0) {
    occupancyDraft.refreshOccupancy(state);
    refreshInteractionForTimeSlot(state);
  }
}

/**
 * Перемещение партии как единая транзакция: выход → движение → время
 * (возможны дневные тики и удаление POI) → прибытие.
 *
 * `extraMinutes` — отложенное время Action, инициировавшего переход: оно
 * уходит в то же изменение времени, чтобы один расход не списался дважды.
 */
function travelToPoiDraft(state: StoreState, targetPoiId: string, extraMinutes = 0): void {
  const currentPoiId = state.party.currentPartyPosition;
  const targetPoi = state.poiSlice.pois[targetPoiId];

  if (!targetPoi) {
    console.warn(`travelToPoi: POI ${targetPoiId} не существует`);
    return;
  }

  const fallbackCellId = targetPoi.parentId !== null ? targetPoi.rootCellId : null;
  const travel = TravelManager.computeTravel(currentPoiId, targetPoiId, state);

  if (!travel.canTravel) {
    console.warn(`Can't travel from ${currentPoiId} to ${targetPoiId}`);
    return;
  }

  endInteraction(state);
  poiDraft.processPoiExit(state, currentPoiId);

  // Позиция партии меняется до изменения времени: refreshOccupancy использует её как якорь.
  partyDraft.moveToPoi(state, targetPoiId, travel.staminaCost);

  advanceTimeDraft(state, travel.timeCost + extraMinutes);

  // Цель перечитывается: последствия времени могли её удалить.
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
  poiDraft.processPoiEnter();

  const isCellTarget = arrivedPoi.parentId === null;

  //TODO potentially we should scout any poi.
  if (isCellTarget && daysPassed > 0) {
    scoutCellDraft(state, targetPoiId);
  }

  occupancyDraft.ensurePoiOccupancy(state, targetPoiId);

  if (!isCellTarget) {
    enterPoiContext(state, targetPoiId);
  }

  state.ui.currentScreen = isCellTarget ? 'strategicMap' : 'poiView';
}

export const worldDraft = {
  advanceTime: advanceTimeDraft,
  travelToPoi: travelToPoiDraft,
  runDayTick: runDayTickDraft,
};

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  currentTime: START_DATE,
  weather: 'clear',

  actions: {
    startNewGame: () => {
      set((state) => {
        bootstrapNewGame(state);
      });
    },

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

    travelToPoi: (targetPoiId) => {
      set((state) => {
        travelToPoiDraft(state, targetPoiId);
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
