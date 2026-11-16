import { describe, expect, it } from 'vitest';

import { t } from './i18n';
import { describeCostShortage, describeRequirement } from './interactionText';

describe('English UI messages', () => {
  it('resolves HUD templates without depending on the React entry point', () => {
    expect(t('gameHud.day', { day: 4 })).toBe('Day 4');
    expect(t('gameHud.comingLater', { label: t('gameHud.settings') })).toBe(
      'Settings · coming later',
    );
  });

  it.each([
    [0, '0 coins'],
    [1, '1 coin'],
    [2, '2 coins'],
  ])('renders an Action cost of %i with the correct coin form', (count, expected) => {
    expect(t('interactionUi.coins', { count })).toBe(expected);
  });

  it('formats resource and requirement tooltips as text for React', () => {
    expect(describeCostShortage({ type: 'money', available: 0, required: 10 })).toBe(
      'Not enough money: 0 of 10',
    );
    expect(
      describeCostShortage({ type: 'item', itemId: 'food & water', available: 0, required: 1 }),
    ).toBe('Not enough food & water: 0 of 1');
    expect(describeRequirement({ type: 'stat', statId: 'str', min: 10 })).toBe(
      'Stat Strength ≥ 10',
    );
  });
});
