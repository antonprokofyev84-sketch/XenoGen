import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { useGameState } from '@/state/useGameState';
import type { InitialAction } from '@/types/action.types';

const state = () => useGameState.getState();
const read = () => state().interactionSlice.actions.continueInteraction();
const money = () => state().inventory.containers.protagonist.money;
const entryId = 'entryTest:entry';
const lateId = 'entryTest:late';
const tailId = 'entryTest:tail';
const actionId = 'entryTest:wait';
const template = POI_TEMPLATES.fixtureHub;
const act = (action: InitialAction) => {
  INITIAL_ACTIONS[actionId] = action;
  state().interactionSlice.actions.performAction(actionId);
};
const reenter = () => {
  state().world.actions.travelToPoi('fixtureOpenSite');
  read();
  state().world.actions.travelToPoi('fixtureHub');
  read();
};

beforeEach(() => {
  INITIAL_INTERCEPTORS[entryId] = { result: { effects: [{ type: 'addMoney', amount: 1 }] } };
  INITIAL_INTERCEPTORS[lateId] = {
    conditions: [{ type: 'questVar', questId: 'fixtureQuest', key: 'ready', equals: true }],
    result: { effects: [{ type: 'addMoney', amount: 7 }] },
  };
  POI_TEMPLATES.fixtureHub = { ...template, interceptorIds: [entryId, lateId] };
  useGameState.setState(useGameState.getInitialState(), true);
  state().characters.actions.resetProtagonist();
  state().world.actions.startNewGame();
  state().occupancySlice.actions.assignNpcToSlot('fixtureHub', 'visitor', 'fixtureVisitorA');
  state().inventory.actions.modifyMoney('protagonist', 100);
  state().world.actions.travelToPoi('fixtureHub');
  read();
});

afterEach(() => {
  delete INITIAL_INTERCEPTORS[entryId];
  delete INITIAL_INTERCEPTORS[lateId];
  delete INITIAL_INTERCEPTORS[tailId];
  delete INITIAL_ACTIONS[actionId];
  POI_TEMPLATES.fixtureHub = template;
});

describe('Interceptors belong to an entry', () => {
  it('keeps the current Frame and history when the same POI context is requested again', () => {
    state().interactionSlice.actions.performAction('fixture:openInnerFrame');
    read();
    const interaction = state().interactionSlice.currentInteraction;
    state().interactionSlice.actions.enterPoiContext('fixtureHub');
    expect(state().interactionSlice.currentInteraction).toBe(interaction);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub:inner');
    expect(money()).toBe(101);
  });

  it.each([
    ['work', 'keeper', 'fixtureKeeper'],
    ['home', 'resident', 'fixtureResident'],
  ] as const)(
    'starts the %s NPC entry only when the NPC identity changes',
    (group, slotId, npcId) => {
      INITIAL_INTERCEPTORS[tailId] = { result: { effects: [{ type: 'addMoney', amount: 3 }] } };
      POI_TEMPLATES.fixtureHub = {
        ...POI_TEMPLATES.fixtureHub,
        npcSlots: {
          ...template.npcSlots,
          [group]: template.npcSlots?.[group]?.map((slot) => ({
            ...slot,
            interceptorIds: [...(slot.interceptorIds ?? []), tailId],
          })),
        },
      };

      state().interactionSlice.actions.enterSlotContext(slotId, npcId);
      expect(money()).toBe(104);
      const interaction = state().interactionSlice.currentInteraction;
      state().interactionSlice.actions.enterSlotContext(slotId, npcId);
      expect(state().interactionSlice.currentInteraction).toBe(interaction);
      expect(money()).toBe(104);
      read();

      state().interactionSlice.actions.returnToPoiContext();
      read();
      expect(money()).toBe(104);
      expect(state().npcSlice.byId[npcId].timesMet).toBe(1);
      state().interactionSlice.actions.enterSlotContext(slotId, npcId);
      expect(money()).toBe(107);
    },
  );

  it.each([300, 1440, 2880])(
    'does not repeat entry events after %i minutes inside a POI',
    (minutes) => {
      expect(money()).toBe(101);
      state().world.actions.changeTime(minutes);
      read();
      expect(money()).toBe(101);
      expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual([]);
      reenter();
      expect(money()).toBe(102);
    },
  );

  it('defers newly eligible events until re-entry instead of collecting them after Action time', () => {
    act({
      label: 'Wait',
      cost: { time: 300 },
      result: {
        narrative: ['Several hours pass.'],
        effects: [{ type: 'setQuestVar', questId: 'fixtureQuest', key: 'ready', value: true }],
      },
    });
    expect(money()).toBe(101);
    read();
    expect(money()).toBe(101);
    reenter();
    expect(money()).toBe(109);
  });

  it('does not create entry events during a timed local transition or return to root', () => {
    act({
      label: 'Wait',
      cost: { time: 300 },
      result: {
        narrative: ['Waiting.'],
        transition: { type: 'frame', frameId: 'fixtureHub:inner', time: 300 },
      },
    });
    read();
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub:inner');
    read();
    state().interactionSlice.actions.performAction('fixture:backToRoot');
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub');
    expect(money()).toBe(101);
  });

  it('preserves the remaining entry snapshot through time and resumes it after the event Frame', () => {
    INITIAL_INTERCEPTORS[entryId] = {
      priority: 200,
      executionLimit: { total: 1 },
      result: { transition: { type: 'frame', frameId: 'fixtureHub:inner' } },
    };
    INITIAL_INTERCEPTORS[tailId] = { result: { effects: [{ type: 'addMoney', amount: 3 }] } };
    POI_TEMPLATES.fixtureHub = { ...template, interceptorIds: [entryId, tailId, lateId] };
    reenter();
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub:inner');
    const queue = [{ type: 'interceptor', interceptorId: tailId }];
    expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual(queue);
    state().world.actions.changeTime(300);
    expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual(queue);
    act({
      label: 'Continue',
      result: {
        effects: [{ type: 'setQuestVar', questId: 'fixtureQuest', key: 'ready', value: true }],
        transition: { type: 'root' },
      },
    });
    expect(money()).toBe(104);
    expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual([]);
  });

  it.each([
    'command',
    'transition',
    'departure',
    'actionCost',
    'timedTransition',
    'forceExit',
  ] as const)('does not treat a return from an NPC via %s as a new POI entry', (reason) => {
    const keeperLeaves =
      reason === 'departure' || reason === 'actionCost' || reason === 'timedTransition';
    const slotId = keeperLeaves ? 'keeper' : 'visitor';
    const npcId = keeperLeaves ? 'fixtureKeeper' : 'fixtureVisitorA';
    state().interactionSlice.actions.enterSlotContext(slotId, npcId);
    read();
    switch (reason) {
      case 'command':
        state().interactionSlice.actions.returnToPoiContext();
        break;
      case 'transition':
        state().interactionSlice.actions.performAction('fixture:leaveSlot');
        break;
      case 'departure':
        state().world.actions.changeTime(12 * 60);
        break;
      case 'actionCost':
        act({
          label: 'Wait',
          cost: { time: 12 * 60 },
          result: {
            narrative: ['The shift has ended.'],
            transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
          },
        });
        read();
        read();
        state().interactionSlice.actions.performAction('fixture:backToRoot');
        break;
      case 'timedTransition':
        act({
          label: 'Wait',
          result: {
            narrative: ['Waiting for the keeper.'],
            transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner', time: 12 * 60 },
          },
        });
        read();
        read();
        state().interactionSlice.actions.performAction('fixture:backToRoot');
        break;
      case 'forceExit':
        act({ label: 'Conflict', result: { effects: [{ type: 'modifyTension', delta: 100 }] } });
        break;
    }
    if (keeperLeaves) {
      expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(
        CONTEXT_EXIT_FRAMES.npcLeft,
      );
      expect(state().npcSlice.byId[npcId].timesMet).toBe(0);
      read();
      state().interactionSlice.actions.performAction('system:endUnavailableConversation');
    }
    expect(state().interactionSlice.currentInteraction?.npcId).toBeUndefined();
    expect(state().interactionSlice.currentInteraction?.poiId).toBe('fixtureHub');
    expect(state().npcSlice.byId[npcId].timesMet).toBe(1);
    expect(money()).toBe(101);
  });

  it('rolls entry appearance only on entry, including after the daily cache expires', () => {
    const appearance = vi.fn(() => 0);
    INITIAL_INTERCEPTORS[entryId] = { appearanceChance: appearance, result: {} };
    reenter();
    expect(appearance).toHaveBeenCalledTimes(1);
    state().world.actions.changeTime(2 * 1440);
    read();
    expect(appearance).toHaveBeenCalledTimes(1);
    reenter();
    expect(appearance).toHaveBeenCalledTimes(2);
  });

  it('retains a scheduled forceExit through a new day and executes it on return to root', () => {
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    act({
      label: 'Conflict',
      result: {
        effects: [{ type: 'modifyTension', delta: 100 }],
        transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
      },
    });
    read();
    state().world.actions.changeTime(1440);
    expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual([
      { type: 'forceExit' },
    ]);
    state().interactionSlice.actions.performAction('fixture:backToRoot');
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(
      'fixtureHub/keeper:forceExit',
    );
    expect(money()).toBe(101);
  });
});
