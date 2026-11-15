import text from '@/locales/en.json';
import type { CostShortage } from '@/systems/interaction/actionCosts';
import type { ActionCondition } from '@/types/condition.types';

import { formatText } from './formatText';

export function describeCostShortage(shortage: CostShortage): string {
  const values = { available: shortage.available, required: shortage.required };
  switch (shortage.type) {
    case 'money':
      return formatText(text.interactionText.insufficientMoney, values);
    case 'stamina':
      return formatText(text.interactionText.insufficientStamina, values);
    case 'item':
      return formatText(text.interactionText.insufficientItem, {
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
      return text.interactionText.questRequirement;
    case 'stat':
      key = text.mainStats[condition.statId];
      break;
    case 'skill':
      key = text.skills[condition.skillId];
      break;
    case 'item':
      key = condition.itemId;
      break;
    case 'defeated':
      key = condition.enemyTypeId;
      break;
    case 'regionLevel':
      key = text.gameHud.parameters[condition.param];
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
  return `${text.interactionText.requirementLabels[condition.type]} ${key} ${range}`.trim();
}
