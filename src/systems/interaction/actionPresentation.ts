import type { ActionAvailability } from '@/systems/interaction/actionAvailability';
import { t } from '@/systems/text/i18n';
import { describeCostShortage, describeRequirement } from '@/systems/text/interactionText';
import { resolveText } from '@/systems/text/resolveText';
import type { ActionCategory, InitialAction } from '@/types/action.types';
import type { ActionId } from '@/types/ids.types';

export interface UiAction {
  actionId: ActionId;
  label: string;
  isDisabled: boolean;
  category: ActionCategory;
  moneyCost: number;
  hints: string[];
  disabledReasons: string[];
}

/** Форматирует готовую оценку Action, не повторяя проверки и вычисление стоимости. */
export function resolveActionPresentation(
  actionId: ActionId,
  action: InitialAction,
  availability: ActionAvailability,
  categoryOverride?: ActionCategory,
): UiAction {
  const hints: string[] = [];
  const disabledReasons: string[] = [];
  for (const { condition, isMet } of availability.requirements) {
    const description = describeRequirement(condition);
    if (isMet) {
      hints.push(description);
    } else {
      disabledReasons.push(t('interactionText.required', { requirement: description }));
    }
  }

  const { cost, shortages, remainingPerDay, remainingTotal, isLimitReached } = availability;
  if (cost.items.length > 0) {
    hints.push(
      t('interactionText.items', {
        items: cost.items.map((item) => `${item.itemId} ×${item.count}`).join(', '),
      }),
    );
  }
  if (cost.stamina > 0) hints.push(t('interactionText.stamina', { amount: cost.stamina }));
  disabledReasons.push(...shortages.map(describeCostShortage));
  if (isLimitReached) disabledReasons.push(t('interactionText.limitReached'));
  if (remainingPerDay !== undefined) {
    hints.push(t('interactionText.dailyAttempts', { amount: remainingPerDay }));
  }
  if (remainingTotal !== undefined) {
    hints.push(t('interactionText.totalAttempts', { amount: remainingTotal }));
  }

  return {
    actionId,
    label: resolveText(action.label),
    isDisabled: availability.isDisabled,
    category: categoryOverride ?? action.category ?? 'interaction',
    moneyCost: cost.money,
    hints: [...new Set(hints)],
    disabledReasons: [...new Set(disabledReasons)],
  };
}
