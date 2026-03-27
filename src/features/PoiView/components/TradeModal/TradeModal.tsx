import { useCallback, useMemo, useReducer } from 'react';

import { PROTAGONIST_ID } from '@/constants';
import { useGameState } from '@/state/useGameState';
import {
  calculateOfferTotal,
  getItemBasePrice,
  isTradeAcceptable,
} from '@/systems/trade/tradeExecution';
import { getBuyMultiplier, getSellMultiplier } from '@/systems/trade/tradePricing';
import type { InventoryItem } from '@/types/inventory.types';
import type { TradeOffer, TradeOfferItem } from '@/types/trade.types';

import { TradeInventoryPanel } from './components/TradeInventoryPanel';
import { TradeOfferArea } from './components/TradeOfferArea';
import { TradeSummary } from './components/TradeSummary';

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

  // --- Store selectors ---
  const interaction = useGameState((s) => s.interactionSlice.currentInteraction);
  const closeTrade = useGameState((s) => s.interactionSlice.actions.closeTrade);

  const playerContainer = useGameState((s) => s.inventory.containers[PROTAGONIST_ID]);
  const traderId = interaction?.poiId ?? '';
  const traderContainer = useGameState((s) => s.inventory.containers[traderId]);

  // Store-mutating actions
  const addItemAction = useGameState((s) => s.inventory.actions.addItem);
  const removeItemAction = useGameState((s) => s.inventory.actions.removeItem);
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

  const hasAnyOffer =
    state.playerOffer.length > 0 ||
    state.playerMoneyOffer > 0 ||
    state.traderOffer.length > 0 ||
    state.traderMoneyOffer > 0;

  const canConfirm =
    hasAnyOffer && isTradeAcceptable(playerOffer, sellMultiplier, traderOffer, buyMultiplier);

  // --- Trade execution ---
  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;

    // Remove player offer items from player, add to trader
    for (const offerItem of state.playerOffer) {
      const itemPayload = {
        templateId: offerItem.templateId,
        type: offerItem.type,
        rarity: offerItem.rarity,
        quantity: offerItem.quantity,
      };
      removeItemAction(PROTAGONIST_ID, itemPayload);
      if (traderId) addItemAction(traderId, itemPayload);
    }

    // Add trader offer items to player, remove from trader
    for (const offerItem of state.traderOffer) {
      const itemPayload = {
        templateId: offerItem.templateId,
        type: offerItem.type,
        rarity: offerItem.rarity,
        quantity: offerItem.quantity,
      };
      addItemAction(PROTAGONIST_ID, itemPayload);
      if (traderId) removeItemAction(traderId, itemPayload);
    }

    // Money transfer
    if (state.playerMoneyOffer > 0) {
      modifyMoneyAction(PROTAGONIST_ID, -state.playerMoneyOffer);
      if (traderId) modifyMoneyAction(traderId, state.playerMoneyOffer);
    }
    if (state.traderMoneyOffer > 0) {
      modifyMoneyAction(PROTAGONIST_ID, state.traderMoneyOffer);
      if (traderId) modifyMoneyAction(traderId, -state.traderMoneyOffer);
    }

    dispatch({ type: 'RESET' });
    closeTrade();
  }, [canConfirm, state, traderId, addItemAction, removeItemAction, modifyMoneyAction, closeTrade]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'RESET' });
    closeTrade();
  }, [closeTrade]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <div className="tradeModalOverlay" onClick={handleCancel}>
      <div className="tradeModal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tradeHeader">
          <h2 className="tradeTitle">Trade</h2>
          <div className="tradeContext">
            <span className="contextLabel">
              Relation: <strong>{Math.round(effectiveRelation)}</strong>
            </span>
            <span className="contextLabel">
              Tension: <strong>{Math.round(tension)}</strong>
            </span>
          </div>
          <button className="closeBtn" onClick={handleCancel}>
            ✕
          </button>
        </div>

        {/* Main content: two inventory panels */}
        <div className="tradeBody">
          <div className="tradeSide">
            <TradeInventoryPanel
              title="Your Inventory"
              items={playerContainer.items}
              money={playerContainer.money}
              offerItems={state.playerOffer}
              getItemPrice={getPlayerItemPrice}
              onItemClick={handlePlayerItemClick}
            />
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
          </div>

          <div className="tradeSide">
            <TradeInventoryPanel
              title="Trader Inventory"
              items={traderItems}
              money={traderMoney}
              offerItems={state.traderOffer}
              getItemPrice={getTraderItemPrice}
              onItemClick={handleTraderItemClick}
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
            />
          </div>
        </div>

        {/* Summary + Actions */}
        <TradeSummary
          playerTotal={playerTotal}
          traderTotal={traderTotal}
          onCancel={handleCancel}
          onReset={handleReset}
          onConfirm={handleConfirm}
          canConfirm={canConfirm}
          hasAnyOffer={hasAnyOffer}
        />
      </div>
    </div>
  );
};
