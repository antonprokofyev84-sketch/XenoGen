import { PROTAGONIST_ID } from '@/constants';
import { characterDraft, characterSelectors } from '@/state/gameSlices/characters';
import { inventoryDraft, inventorySelectors } from '@/state/gameSlices/inventory';
import type { StoreState } from '@/state/useGameState';
import type { ActionContext, ActionCost } from '@/types/action.types';

import { resolveActionNumber } from './outcomes';

/**
 * Обязательные затраты попытки.
 *
 * `cost` — единственный источник обязательных затрат: ту же плату не нужно
 * описывать условием наличия и эффектом списания.
 *
 * Динамические величины разрешаются **один раз** на попытку, после чего
 * проверка доступности и фактическое списание работают с одним и тем же
 * объектом. Поэтому значение не может измениться между проверкой и оплатой.
 */

export interface ResolvedItemCost {
  itemId: string;
  count: number;
}

export interface ResolvedActionCost {
  money: number;
  /** Личная stamina протагониста, а не партийный пул. */
  stamina: number;
  /** Минуты игрового времени; списываются завершающим мировым действием. */
  time: number;
  items: ResolvedItemCost[];
}

export const EMPTY_RESOLVED_COST: ResolvedActionCost = {
  money: 0,
  stamina: 0,
  time: 0,
  items: [],
};

export function resolveActionCost(
  cost: ActionCost | undefined,
  context: ActionContext,
): ResolvedActionCost {
  if (!cost) return { ...EMPTY_RESOLVED_COST, items: [] };

  return {
    money: cost.money === undefined ? 0 : resolveActionNumber(cost.money, context),
    stamina: cost.stamina === undefined ? 0 : resolveActionNumber(cost.stamina, context),
    time: cost.time === undefined ? 0 : resolveActionNumber(cost.time, context),
    items: (cost.items ?? []).map((item) => ({
      itemId: item.itemId,
      count: resolveActionNumber(item.count, context),
    })),
  };
}

/** Время здесь не проверяется: оно всегда доступно и списывается позже. */
export function canAffordCost(state: StoreState, cost: ResolvedActionCost): boolean {
  if ((state.inventory.containers[PROTAGONIST_ID]?.money ?? 0) < cost.money) return false;

  if (cost.stamina > 0) {
    const stamina = characterSelectors.selectCharacterById(PROTAGONIST_ID)(state)?.stamina ?? 0;
    if (stamina < cost.stamina) return false;
  }

  return cost.items.every(
    (item) => inventorySelectors.selectPlayerItemCount(item.itemId)(state) >= item.count,
  );
}

/**
 * Авансовое списание денег, предметов и личной stamina.
 *
 * `cost.time` здесь не тратится: минуты передаются завершающему мировому
 * действию, чтобы один и тот же расход не списался дважды.
 */
export function payResolvedCost(state: StoreState, cost: ResolvedActionCost): void {
  if (cost.money > 0) {
    inventoryDraft.modifyMoney(state, PROTAGONIST_ID, -cost.money);
  }

  for (const item of cost.items) {
    const unpaid = inventoryDraft.removeItemsByTemplateId(
      state,
      PROTAGONIST_ID,
      item.itemId,
      item.count,
    );

    // Доступность проверена до списания, поэтому остаток — нарушенный инвариант.
    if (unpaid > 0) {
      console.warn(`cost: не списано ${unpaid} шт. "${item.itemId}"`);
    }
  }

  if (cost.stamina > 0) {
    characterDraft.changeStamina(state, PROTAGONIST_ID, -cost.stamina);
  }
}
