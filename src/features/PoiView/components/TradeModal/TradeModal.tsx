import { useCallback, useMemo, useReducer, useState } from 'react';

import { PROTAGONIST_ID } from '@/constants';
import { characterSelectors, useGameState } from '@/state/useGameState';
import {
  calculateOfferTotal,
  calculateTradeBaseCost,
  getItemBasePrice,
} from '@/systems/trade/tradeExecution';
import { buildTradeOfferRule, evaluateTradeNegotiation } from '@/systems/trade/tradeNegotiation';
import { getBuyMultiplier, getSellMultiplier } from '@/systems/trade/tradePricing';
import type { InventoryItem } from '@/types/inventory.types';
import type { TradeOffer, TradeOfferItem } from '@/types/trade.types';

import { TradeInfoColumn } from './components/TradeInfoColumn';
import { TradeInventoryPanel } from './components/TradeInventoryPanel';
import { TradeOfferArea } from './components/TradeOfferArea';

import './TradeModal.scss';

// =====================================================================
// LOCAL STATE (useReducer)
// =====================================================================

interface TradeState {
  playerOffer: TradeOfferItem[];
  traderOffer: TradeOfferItem[];
  playerMoneyOffer: number;
  traderMoneyOffer: number;
}

type TradeAction =
  | { type: 'ADD_PLAYER_ITEM'; item: TradeOfferItem }
  | { type: 'REMOVE_PLAYER_ITEM'; item: TradeOfferItem }
  | { type: 'ADD_TRADER_ITEM'; item: TradeOfferItem }
  | { type: 'REMOVE_TRADER_ITEM'; item: TradeOfferItem }
  | { type: 'SET_PLAYER_MONEY'; value: number }
  | { type: 'SET_TRADER_MONEY'; value: number }
  | { type: 'RESET' };

const initialTradeState: TradeState = {
  playerOffer: [],
  traderOffer: [],
  playerMoneyOffer: 0,
  traderMoneyOffer: 0,
};

function addToOffer(offer: TradeOfferItem[], item: TradeOfferItem): TradeOfferItem[] {
  const existing = offer.find((o) => o.templateId === item.templateId && o.rarity === item.rarity);
  if (existing) {
    return offer.map((o) =>
      o.templateId === item.templateId && o.rarity === item.rarity
        ? { ...o, quantity: o.quantity + item.quantity }
        : o,
    );
  }
  return [...offer, { ...item }];
}

function removeFromOffer(offer: TradeOfferItem[], item: TradeOfferItem): TradeOfferItem[] {
  const existing = offer.find((o) => o.templateId === item.templateId && o.rarity === item.rarity);
  if (!existing) return offer;

  if (existing.quantity <= item.quantity) {
    return offer.filter((o) => !(o.templateId === item.templateId && o.rarity === item.rarity));
  }

  return offer.map((o) =>
    o.templateId === item.templateId && o.rarity === item.rarity
      ? { ...o, quantity: o.quantity - item.quantity }
      : o,
  );
}

function tradeReducer(state: TradeState, action: TradeAction): TradeState {
  switch (action.type) {
    case 'ADD_PLAYER_ITEM':
      return { ...state, playerOffer: addToOffer(state.playerOffer, action.item) };
    case 'REMOVE_PLAYER_ITEM':
      return { ...state, playerOffer: removeFromOffer(state.playerOffer, action.item) };
    case 'ADD_TRADER_ITEM':
      return { ...state, traderOffer: addToOffer(state.traderOffer, action.item) };
    case 'REMOVE_TRADER_ITEM':
      return { ...state, traderOffer: removeFromOffer(state.traderOffer, action.item) };
    case 'SET_PLAYER_MONEY':
      return { ...state, playerMoneyOffer: action.value };
    case 'SET_TRADER_MONEY':
      return { ...state, traderMoneyOffer: action.value };
    case 'RESET':
      return initialTradeState;
    default:
      return state;
  }
}

// =====================================================================
// COMPONENT
// =====================================================================

export const TradeModal = () => {
  const [state, dispatch] = useReducer(tradeReducer, initialTradeState);
  const [lastResult, setLastResult] = useState<'success' | 'fail' | null>(null);

  // --- Store selectors ---
  const interaction = useGameState((s) => s.interactionSlice.currentInteraction);
  const closeTrade = useGameState((s) => s.interactionSlice.actions.closeTrade);
  const performService = useGameState((s) => s.interactionSlice.actions.performService);

  const playerContainer = useGameState((s) => s.inventory.containers[PROTAGONIST_ID]);
  const traderId = interaction?.poiId ?? '';
  const traderContainer = useGameState((s) => s.inventory.containers[traderId]);
  const tradeSkill = useGameState(
    (s) => characterSelectors.selectEffectiveSkills(PROTAGONIST_ID)(s)?.trade ?? 0,
  );

  // Store-mutating actions
  const addItemsAction = useGameState((s) => s.inventory.actions.addItems);
  const removeItemsAction = useGameState((s) => s.inventory.actions.removeItems);
  const modifyMoneyAction = useGameState((s) => s.inventory.actions.modifyMoney);

  if (!interaction || !playerContainer) return null;

  const effectiveRelation = interaction.effectiveRelation;
  const tension = interaction.tension;

  const buyMultiplier = getBuyMultiplier(effectiveRelation, tension);
  const sellMultiplier = getSellMultiplier(effectiveRelation, tension);

  const traderItems = traderContainer?.items ?? [];
  const traderMoney = traderContainer?.money ?? 0;

  // --- Price helpers ---
  const getPlayerItemPrice = useCallback(
    (item: InventoryItem | TradeOfferItem) => Math.round(getItemBasePrice(item) * sellMultiplier),
    [sellMultiplier],
  );

  const getTraderItemPrice = useCallback(
    (item: InventoryItem | TradeOfferItem) => Math.round(getItemBasePrice(item) * buyMultiplier),
    [buyMultiplier],
  );

  // --- Add to offer handlers ---
  const handlePlayerItemClick = useCallback(
    (item: InventoryItem) => {
      const offered = state.playerOffer.find(
        (o) => o.templateId === item.templateId && o.rarity === item.rarity,
      );
      const offeredQty = offered?.quantity ?? 0;
      if (offeredQty >= item.quantity) return;

      const offerItem: TradeOfferItem = {
        templateId: item.templateId,
        type: item.type,
        rarity: item.rarity,
        quantity: 1,
      };
      dispatch({ type: 'ADD_PLAYER_ITEM', item: offerItem });
    },
    [state.playerOffer],
  );

  const handleTraderItemClick = useCallback(
    (item: InventoryItem) => {
      const offered = state.traderOffer.find(
        (o) => o.templateId === item.templateId && o.rarity === item.rarity,
      );
      const offeredQty = offered?.quantity ?? 0;
      if (offeredQty >= item.quantity) return;

      const offerItem: TradeOfferItem = {
        templateId: item.templateId,
        type: item.type,
        rarity: item.rarity,
        quantity: 1,
      };
      dispatch({ type: 'ADD_TRADER_ITEM', item: offerItem });
    },
    [state.traderOffer],
  );

  // --- Remove from offer handlers ---
  const handleRemovePlayerOffer = useCallback((item: TradeOfferItem) => {
    dispatch({ type: 'REMOVE_PLAYER_ITEM', item: { ...item, quantity: 1 } });
  }, []);

  const handleRemoveTraderOffer = useCallback((item: TradeOfferItem) => {
    dispatch({ type: 'REMOVE_TRADER_ITEM', item: { ...item, quantity: 1 } });
  }, []);

  // --- Offer totals ---
  const playerOffer: TradeOffer = useMemo(
    () => ({ items: state.playerOffer, money: state.playerMoneyOffer }),
    [state.playerOffer, state.playerMoneyOffer],
  );

  const traderOffer: TradeOffer = useMemo(
    () => ({ items: state.traderOffer, money: state.traderMoneyOffer }),
    [state.traderOffer, state.traderMoneyOffer],
  );

  const playerTotal = calculateOfferTotal(playerOffer, sellMultiplier);
  const traderTotal = calculateOfferTotal(traderOffer, buyMultiplier);
  const traderBaseCost = calculateTradeBaseCost(traderOffer);

  const negotiation = useMemo(
    () => evaluateTradeNegotiation(playerTotal, traderTotal, traderBaseCost, tradeSkill),
    [playerTotal, traderTotal, traderBaseCost, tradeSkill],
  );

  // Items-only values (without money) for quick-fill calculation
  const playerItemsValue = playerTotal - state.playerMoneyOffer;
  const traderItemsExpected = traderTotal - state.traderMoneyOffer;
  const traderItemsBase = traderBaseCost - state.traderMoneyOffer;

  const hasAnyOffer =
    state.playerOffer.length > 0 ||
    state.playerMoneyOffer > 0 ||
    state.traderOffer.length > 0 ||
    state.traderMoneyOffer > 0;

  // --- Trade execution ---
  const handleConfirm = useCallback(() => {
    if (!hasAnyOffer) return;

    setLastResult(null);

    const rule = buildTradeOfferRule(
      negotiation.satisfaction,
      traderTotal,
      interaction.tradeAttempts,
    );
    const outcome = performService('tradeOffer', rule);

    if (!outcome?.success) {
      setLastResult('fail');
      return;
    }

    // Accepted — execute item transfer
    if (state.playerOffer.length > 0) {
      removeItemsAction(PROTAGONIST_ID, state.playerOffer);
      if (traderId) addItemsAction(traderId, state.playerOffer);
    }

    if (state.traderOffer.length > 0) {
      addItemsAction(PROTAGONIST_ID, state.traderOffer);
      if (traderId) removeItemsAction(traderId, state.traderOffer);
    }

    const netMoney = state.traderMoneyOffer - state.playerMoneyOffer;
    if (netMoney !== 0) {
      modifyMoneyAction(PROTAGONIST_ID, netMoney);
      if (traderId) modifyMoneyAction(traderId, -netMoney);
    }

    setLastResult('success');
    dispatch({ type: 'RESET' });
  }, [
    hasAnyOffer,
    negotiation.satisfaction,
    performService,
    state,
    traderId,
    addItemsAction,
    removeItemsAction,
    modifyMoneyAction,
  ]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'RESET' });
    closeTrade();
  }, [closeTrade]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleQuickFill = useCallback((playerMoney: number, traderMoney: number) => {
    dispatch({ type: 'SET_PLAYER_MONEY', value: playerMoney });
    dispatch({ type: 'SET_TRADER_MONEY', value: traderMoney });
  }, []);

  return (
    <div className="tradeModalOverlay" onClick={handleCancel}>
      <div className="tradeModal" onClick={(e) => e.stopPropagation()}>
        <div className="tradeBody">
          {/* Left: Player inventory */}
          <div className="tradeSide tradeSidePlayer">
            <TradeInventoryPanel
              title="Your Inventory"
              items={playerContainer.items}
              money={playerContainer.money}
              offerItems={state.playerOffer}
              getItemPrice={getPlayerItemPrice}
              onItemClick={handlePlayerItemClick}
            />
          </div>

          {/* Center: context -> controls -> offers -> result -> actions */}
          <TradeInfoColumn
            effectiveRelation={effectiveRelation}
            tension={tension}
            differenceValue={traderTotal - playerTotal}
            satisfaction={negotiation.satisfaction}
            lastResult={lastResult}
            hasAnyOffer={hasAnyOffer}
            onCancel={handleCancel}
            onReset={handleReset}
            onConfirm={handleConfirm}
            onQuickFill={handleQuickFill}
            playerMoneyOffer={state.playerMoneyOffer}
            traderMoneyOffer={state.traderMoneyOffer}
            playerItemsValue={playerItemsValue}
            traderItemsExpected={traderItemsExpected}
            traderItemsBase={traderItemsBase}
            tradeSkill={tradeSkill}
            maxPlayerMoney={playerContainer.money}
            maxTraderMoney={traderMoney}
            offersContent={
              <>
                <TradeOfferArea
                  title="Your Offer"
                  items={state.playerOffer}
                  money={state.playerMoneyOffer}
                  totalValue={playerTotal}
                  getItemPrice={getPlayerItemPrice}
                  onRemoveItem={handleRemovePlayerOffer}
                  onMoneyChange={(val) => dispatch({ type: 'SET_PLAYER_MONEY', value: val })}
                  maxMoney={playerContainer.money}
                />
                <TradeOfferArea
                  title="Their Offer"
                  items={state.traderOffer}
                  money={state.traderMoneyOffer}
                  totalValue={traderTotal}
                  getItemPrice={getTraderItemPrice}
                  onRemoveItem={handleRemoveTraderOffer}
                  onMoneyChange={(val) => dispatch({ type: 'SET_TRADER_MONEY', value: val })}
                  maxMoney={traderMoney}
                  scrollLeft
                />
              </>
            }
          />

          {/* Right: Trader inventory */}
          <div className="tradeSide tradeSideTrader">
            <TradeInventoryPanel
              title="Trader Inventory"
              items={traderItems}
              money={traderMoney}
              offerItems={state.traderOffer}
              getItemPrice={getTraderItemPrice}
              onItemClick={handleTraderItemClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
