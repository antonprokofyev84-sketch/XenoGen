import type { StoreState } from '@/state/useGameState';
import {
  endInteraction,
  enterPoiContext,
  enterSlotContext,
} from '@/systems/interaction/interactionState';
import { performAction } from '@/systems/interaction/performAction';
import { resolveInteractionPresentation } from '@/systems/interaction/presentation';
import { resolveInteractionOptions } from '@/systems/interaction/resolveOptions';
import { resolveTradeOffer } from '@/systems/trade/resolveTradeOffer';
import type {
  CurrentInteraction,
  DailyInteractionMemoryBySubject,
  ExecutionTotalsBySubject,
  InteractionLogEntry,
} from '@/types/interactionRuntime.types';

import type { GameSlice } from '../types';

/**
 * Состояние взаимодействия.
 *
 * Слайс намеренно тонкий: вся логика входов, очереди событий и исполнения
 * Actions живёт в `@/systems/interaction` и работает на draft, поэтому
 * вложенных `set` нет. Здесь только хранение и публичные команды.
 *
 * Доступные варианты экрана не хранятся: они производные и собираются
 * резолвером по текущему контексту и состоянию мира.
 */
export interface InteractionSlice {
  currentInteraction: CurrentInteraction | null;

  /** Очищается целиком в конце игрового дня. */
  dailyMemoryBySubject: DailyInteractionMemoryBySubject;

  /** Долговременные счётчики: конец дня их не трогает. */
  executionTotalsBySubject: ExecutionTotalsBySubject;

  /** Цель перехода `trade`; существующее модальное окно сохраняется как есть. */
  isTrading: boolean;

  actions: {
    enterPoiContext: (poiId: string) => void;
    enterSlotContext: (slotId: string, npcId: string) => void;
    returnToPoiContext: () => void;
    endInteraction: () => void;
    performAction: (actionId: string) => void;
    setTrading: (isTrading: boolean) => void;
    /** Торговля сохранена как есть до утверждения её собственного `scope`. */
    resolveTradeOffer: (satisfaction: number, tradeValue: number, attempts: number) => boolean;
  };
}

/** Стабильная пустая ссылка: новый литерал на каждый вызов менял бы снимок. */
const EMPTY_LOG: readonly InteractionLogEntry[] = [];

/**
 * Мемоизация производного значения по ссылке корня состояния.
 *
 * Зачем вообще: zustand построен на `useSyncExternalStore`, который сравнивает
 * снимки через `Object.is`. Селектор, собирающий новый объект на каждый вызов,
 * даёт новый снимок при каждом рендере — React считает состояние бесконечно
 * меняющимся и уходит в цикл. Поэтому составной производный результат обязан
 * быть мемоизирован; это общее правило, а не особенность этого экрана.
 *
 * Почему кеш по корню, а не по входам: резолверы читают восемь срезов, и при
 * ручном перечислении (reselect) забытая зависимость даёт не лишний рендер, а
 * молча протухший UI — худший из возможных исходов. Точное автоотслеживание
 * (proxy-memoize) здесь не окупается: пока открыт экран взаимодействия,
 * состояние меняется только от действий игрока, и после действия варианты
 * почти всегда действительно меняются.
 *
 * Immer подменяет ссылку корня только при реальном изменении, поэтому
 * пересчёт происходит ровно один раз на операцию — ровно та семантика, что
 * описана контрактом: «после любого завершённого Action заново собираются все
 * варианты». Кеш общий для всех компонентов, поэтому за один проход рендера
 * значение считается один раз.
 *
 * Следствие, которое стоит знать: от рендера к посторонним изменениям стора
 * это не защищает. Если такое понадобится, лечится сравнением результата с
 * предыдущим внутри этой же функции, без правок компонентов.
 *
 * Кеш на один элемент и живёт в модуле — безопасно, пока стор один.
 */
function memoizeByState<T>(compute: (state: StoreState) => T): (state: StoreState) => T {
  let cache: { state: StoreState; result: T } | undefined;

  return (state) => {
    if (cache?.state !== state) {
      cache = { state, result: compute(state) };
    }

    return cache.result;
  };
}

export const interactionSelectors = {
  selectCurrentInteraction: (state: StoreState): CurrentInteraction | null =>
    state.interactionSlice.currentInteraction,

  selectInteractionLog: (state: StoreState): readonly InteractionLogEntry[] =>
    state.interactionSlice.currentInteraction?.log ?? EMPTY_LOG,

  selectCurrentBackground: (state: StoreState): string | undefined =>
    state.interactionSlice.currentInteraction?.currentBackground,

  selectInteractionOptions: memoizeByState(resolveInteractionOptions),

  selectPresentation: memoizeByState(resolveInteractionPresentation),
};

export const createInteractionSlice: GameSlice<InteractionSlice> = (set) => ({
  currentInteraction: null,
  dailyMemoryBySubject: {},
  executionTotalsBySubject: {},
  isTrading: false,

  actions: {
    enterPoiContext: (poiId) =>
      set((state) => {
        enterPoiContext(state, poiId);
      }),

    enterSlotContext: (slotId, npcId) =>
      set((state) => {
        enterSlotContext(state, slotId, npcId);
      }),

    returnToPoiContext: () =>
      set((state) => {
        const poiId = state.interactionSlice.currentInteraction?.poiId;
        if (poiId === undefined) return;

        enterPoiContext(state, poiId);
      }),

    endInteraction: () =>
      set((state) => {
        endInteraction(state);
      }),

    performAction: (actionId) =>
      set((state) => {
        performAction(state, actionId);
      }),

    setTrading: (isTrading) =>
      set((state) => {
        state.interactionSlice.isTrading = isTrading;
      }),

    resolveTradeOffer: (satisfaction, tradeValue, attempts) => {
      let isAccepted = false;

      set((state) => {
        isAccepted = resolveTradeOffer(state, { satisfaction, tradeValue, attempts });
      });

      return isAccepted;
    },
  },
});
