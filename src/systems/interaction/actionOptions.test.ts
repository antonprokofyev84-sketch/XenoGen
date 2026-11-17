import { produce } from 'immer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { useGameState } from '@/state/useGameState';
import * as conditions from '@/systems/interaction/conditions';
import { resolveInteractionOptions } from '@/systems/interaction/resolveOptions';
import type { InitialAction } from '@/types/action.types';
import type { ActionCondition } from '@/types/condition.types';

const state = () => useGameState.getState();
const actionId = 'optionsTest:action';
const subjectKey = 'poi:fixtureHub';
const rootFrame = INITIAL_FRAMES.fixtureHub;
const install = (action: InitialAction) => {
  INITIAL_ACTIONS[actionId] = action;
  INITIAL_FRAMES.fixtureHub = {
    ...rootFrame,
    actionIds: [...(rootFrame.actionIds ?? []), actionId],
  };
};
const option = () =>
  resolveInteractionOptions(state()).actions.frame.find((action) => action.actionId === actionId);

beforeEach(() => {
  useGameState.setState(useGameState.getInitialState(), true);
  state().characters.actions.resetProtagonist();
  state().characters.actions.resetStaminaToMax('protagonist');
  state().world.actions.startNewGame();
  state().inventory.actions.modifyMoney('protagonist', 100);
  state().inventory.actions.addItem('protagonist', {
    templateId: 'scrap',
    type: 'resource',
    rarity: 'common',
    quantity: 5,
  });
  state().world.actions.travelToPoi('fixtureHub');
  state().interactionSlice.actions.continueInteraction();
});

afterEach(() => {
  delete INITIAL_ACTIONS[actionId];
  INITIAL_FRAMES.fixtureHub = rootFrame;
  vi.restoreAllMocks();
});

describe('Action options and explanations', () => {
  it('evaluates preview costs and requirements once and describes each requirement once', () => {
    const money = vi.fn(() => 7);
    const stamina = vi.fn(() => 2);
    const time = vi.fn(() => 30);
    const count = vi.fn(() => 2);
    const failed: ActionCondition = { type: 'stat', statId: 'will', min: 999 };
    const met: ActionCondition = { type: 'stat', statId: 'str', min: 0 };
    const evaluate = vi.spyOn(conditions, 'evaluateCondition');
    install({
      label: 'Test',
      category: 'rest',
      requirements: [failed, met],
      cost: { money, stamina, time, items: [{ itemId: 'scrap', count }] },
      result: {},
    });

    const resolved = option();
    expect(resolved).toMatchObject({ moneyCost: 7, isDisabled: true, category: 'rest' });
    for (const resolve of [money, stamina, time, count]) expect(resolve).toHaveBeenCalledTimes(1);
    for (const condition of [failed, met]) {
      expect(evaluate.mock.calls.filter((call) => call[1] === condition)).toHaveLength(1);
    }
    expect(resolved?.disabledReasons.filter((line) => line.includes('Willpower'))).toHaveLength(1);
    expect(resolved?.hints.some((line) => line.includes('Willpower'))).toBe(false);
    expect(resolved?.hints.filter((line) => line.includes('Strength'))).toHaveLength(1);
    expect(state().inventory.containers.protagonist.money).toBe(100);
  });

  it('shows one explanation for parallel quest requirements with identical descriptions', () => {
    install({
      label: 'Report back',
      requirements: [
        { type: 'questVar', questId: 'fixtureQuest', key: 'askedBob', equals: true },
        { type: 'questVar', questId: 'fixtureQuest', key: 'askedLena', equals: true },
      ],
      result: {},
    });

    const resolved = option();
    expect(resolved?.isDisabled).toBe(true);
    expect(resolved?.disabledReasons).toEqual(['Required: Quest requirement']);
  });

  it.each(['conditions', 'appearanceChance'] as const)(
    'hides an Action rejected by %s before evaluating its cost',
    (reason) => {
      const money = vi.fn(() => 7);
      install({
        label: 'Hidden',
        cost: { money },
        result: {},
        conditions:
          reason === 'conditions' ? [{ type: 'stat', statId: 'will', min: 999 }] : undefined,
        appearanceChance: reason === 'appearanceChance' ? 0.5 : undefined,
      });
      if (reason === 'appearanceChance') {
        useGameState.setState(
          produce(state(), (draft) => {
            const memory = (draft.interactionSlice.dailyMemoryBySubject[subjectKey] ??= {
              actions: {},
              interceptors: {},
            });
            memory.actions[actionId] = { appeared: false };
          }),
        );
      }

      expect(option()).toBeUndefined();
      expect(money).not.toHaveBeenCalled();
    },
  );

  it('keeps daily and total limits distinct when a new day clears daily memory', () => {
    install({ label: 'Limited', executionLimit: { perDay: 2, total: 7 }, result: {} });
    useGameState.setState(
      produce(state(), (draft) => {
        const memory = (draft.interactionSlice.dailyMemoryBySubject[subjectKey] ??= {
          actions: {},
          interceptors: {},
        });
        memory.actions[actionId] = { executions: 2 };
        draft.interactionSlice.executionTotalsBySubject[subjectKey] = {
          actions: { [actionId]: 5 },
          interceptors: {},
        };
      }),
    );

    expect(option()).toMatchObject({ isDisabled: true });
    expect(option()?.hints).toEqual(
      expect.arrayContaining(['Attempts left today: 0', 'Total attempts left: 2']),
    );
    state().world.actions.endDay();
    expect(option()).toMatchObject({ isDisabled: false });
    expect(option()?.hints).toEqual(
      expect.arrayContaining(['Attempts left today: 2', 'Total attempts left: 2']),
    );
  });

  it('explains all resource shortages without paying the previewed cost', () => {
    install({
      label: 'Expensive',
      cost: { money: 150, stamina: 999, items: [{ itemId: 'scrap', count: 6 }] },
      result: {},
    });
    const resolved = option();
    expect(resolved).toMatchObject({ moneyCost: 150, isDisabled: true });
    expect(resolved?.disabledReasons).toHaveLength(3);
    expect(state().inventory.containers.protagonist.money).toBe(100);
    expect(
      state().inventory.containers.protagonist.items.find((item) => item.templateId === 'scrap')
        ?.quantity,
    ).toBe(5);
  });
});
