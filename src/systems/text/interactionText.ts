import type { CostShortage } from '@/systems/interaction/actionCosts';
import type { ActionCondition } from '@/types/condition.types';

import { t } from './i18n';

export function describeCostShortage(shortage: CostShortage): string {
  const values = { available: shortage.available, required: shortage.required };
  switch (shortage.type) {
    case 'money':
      return t('interactionText.insufficientMoney', values);
    case 'stamina':
      return t('interactionText.insufficientStamina', values);
    case 'item':
      return t('interactionText.insufficientItem', {
        ...values,
        item: shortage.itemId,
      });
  }
}

export function describeRequirement(condition: ActionCondition): string {
  let key = '';
  switch (condition.type) {
    case 'questVar':
    case 'questStatus':
      return t('interactionText.questRequirement');
    case 'stat':
      key = t(`mainStats.${condition.statId}`);
      break;
    case 'skill':
      key = t(`skills.${condition.skillId}`);
      break;
    case 'item':
      key = condition.itemId;
      break;
    case 'defeated':
      key = condition.enemyTypeId;
      break;
    case 'regionLevel':
      key = t(`gameHud.parameters.${condition.param}`);
      break;
  }
  const range =
    condition.exact !== undefined
      ? `= ${condition.exact}`
      : [
          condition.min !== undefined ? `≥ ${condition.min}` : '',
          condition.max !== undefined ? `≤ ${condition.max}` : '',
        ]
          .filter(Boolean)
          .join(', ');
  return `${t(`interactionText.requirementLabels.${condition.type}`)} ${key} ${range}`.trim();
}
