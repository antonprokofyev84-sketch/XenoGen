import { PROTAGONIST_ID } from '@/constants';
import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import { inventoryDraft } from '@/state/gameSlices/inventory';
import { partyDraft } from '@/state/gameSlices/party';
import { questDraft } from '@/state/gameSlices/quest';
import type { StoreState } from '@/state/useGameState';
import { modifyNpcDailyTension } from '@/systems/interaction/dailyMemory';
import { applyChangeRegionParameter } from '@/systems/world/dayPass';
import { markPoiForRemoval } from '@/systems/world/worldTree';
import type { Effect, PoiEffectTarget } from '@/types/gameEffect.types';
import { CURRENT_POI_TARGET } from '@/types/gameEffect.types';
import type { NpcId, PoiId } from '@/types/ids.types';
import type { InventoryItem, ItemType } from '@/types/inventory.types';
import { isCellNode, isNonCellNode } from '@/types/worldNode.types';

/**
 * Единый исполнитель effects.
 *
 * Одна и та же функция вызывается из Action, Interceptor и квестовых
 * таймеров, поэтому поведение каждого эффекта описано ровно один раз. Дневные
 * эффекты POI остаются отдельным проходом по чистым данным, но используют ту
 * же реализацию `changeRegionParameter`.
 *
 * Обязательные затраты действия сюда не входят: `cost` принадлежит
 * исполнителю Actions, чтобы проверка и списание работали с одними и теми же
 * уже разрешёнными величинами.
 */

/**
 * Субъект, относительно которого исполняются effects.
 *
 * Отсутствие нужного субъекта — ошибка авторских данных: например
 * `markCurrentPoiForRemoval` в `onExpire` квестового таймера адресовать
 * нечего.
 */
export interface EffectContext {
  readonly poiId?: PoiId;
  readonly npcId?: NpcId;
}

const resolvePoiTarget = (target: PoiEffectTarget, context: EffectContext): PoiId | undefined =>
  target === CURRENT_POI_TARGET ? context.poiId : target;

const getNonCellPoi = (state: StoreState, poiId: string | undefined) => {
  if (poiId === undefined) return undefined;

  const node = state.poiSlice.pois[poiId];
  return node && isNonCellNode(node) ? node : undefined;
};

/** Сообщает об исчерпании union: новый вариант нельзя забыть обработать. */
const warnUnhandledEffect = (effect: never): void => {
  console.warn('Неизвестный effect', effect);
};

/**
 * Собирает предмет для награды.
 *
 * Effects не несут редкость, поэтому выдаётся базовый вариант. Списание
 * редкостью не ограничено и идёт по всем стопкам шаблона.
 */
const createRewardItem = (itemId: string, count: number): InventoryItem | undefined => {
  const template = ITEMS_TEMPLATES_DB[itemId];
  if (!template) return undefined;

  return {
    templateId: itemId,
    type: template.type as ItemType,
    rarity: 'common',
    quantity: count,
  };
};

function applyEffect(state: StoreState, effect: Effect, context: EffectContext): void {
  switch (effect.type) {
    case 'setQuestStage':
      questDraft.setQuestStage(state, effect.questId, effect.stageId);
      return;

    case 'setQuestVar':
      questDraft.setQuestVar(state, effect.questId, effect.key, effect.value);
      return;

    case 'snapshotDefeatedCount':
      questDraft.snapshotDefeatedCount(state, effect.questId, effect.key, effect.enemyTypeId);
      return;

    case 'setQuestJournalVisibility':
      questDraft.setQuestJournalVisibility(state, effect.questId, effect.isVisible);
      return;

    case 'completeQuest':
      questDraft.completeQuest(state, effect.questId);
      return;

    case 'changeRegionParameter': {
      const poi = getNonCellPoi(state, context.poiId);
      const rootCell = poi && state.poiSlice.pois[poi.rootCellId];

      if (!rootCell || !isCellNode(rootCell)) {
        console.warn('changeRegionParameter: не разрешается root cell текущего POI');
        return;
      }

      applyChangeRegionParameter(rootCell, effect);
      return;
    }

    case 'failQuest':
      questDraft.failQuest(state, effect.questId);
      return;

    case 'markCurrentPoiForRemoval': {
      if (context.poiId === undefined) {
        console.warn('markCurrentPoiForRemoval: нет текущего POI');
        return;
      }

      markPoiForRemoval(state.poiSlice.pois, context.poiId);
      return;
    }

    case 'disablePoiEntryForDays': {
      const poi = getNonCellPoi(state, resolvePoiTarget(effect.poiId, context));

      if (!poi) {
        console.warn(`disablePoiEntryForDays: не разрешается POI "${effect.poiId}"`);
        return;
      }

      poi.details.entryDisabledDaysLeft = effect.days;
      return;
    }

    case 'setPoiEntryDisabled': {
      const poi = getNonCellPoi(state, resolvePoiTarget(effect.poiId, context));

      if (!poi) {
        console.warn(`setPoiEntryDisabled: не разрешается POI "${effect.poiId}"`);
        return;
      }

      // Поле хранится только во «включённом» состоянии.
      if (effect.isDisabled) {
        poi.details.isEntryDisabled = true;
      } else {
        delete poi.details.isEntryDisabled;
      }
      return;
    }

    case 'modifyTension': {
      if (context.npcId === undefined) {
        console.warn('modifyTension: эффект требует slot/NPC-контекст');
        return;
      }

      // Достижение порога проверяет исполнитель взаимодействия по возвращении в root:
      // forceExit не должен прерывать открытый внутренний Frame.
      modifyNpcDailyTension(state, context.npcId, effect.delta);
      return;
    }

    case 'modifyPartyStamina':
      partyDraft.changeStamina(state, effect.delta);
      return;

    case 'addMoney':
      inventoryDraft.modifyMoney(state, PROTAGONIST_ID, effect.amount);
      return;

    case 'addItem': {
      const item = createRewardItem(effect.itemId, effect.count);

      if (!item) {
        console.warn(`addItem: неизвестный предмет "${effect.itemId}"`);
        return;
      }

      inventoryDraft.addItem(state, PROTAGONIST_ID, item);
      return;
    }

    case 'removeItem':
      inventoryDraft.removeItemsByTemplate(state, PROTAGONIST_ID, effect.itemId, effect.count);
      return;

    default:
      warnUnhandledEffect(effect);
  }
}

export function applyEffects(
  state: StoreState,
  effects: readonly Effect[] | undefined,
  context: EffectContext = {},
): void {
  if (!effects) return;

  for (const effect of effects) {
    applyEffect(state, effect, context);
  }
}
