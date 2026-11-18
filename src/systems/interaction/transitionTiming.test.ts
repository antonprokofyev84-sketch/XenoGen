import { produce } from 'immer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { createInitialDataBundle } from '@/data/initial/bundle';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { useGameState } from '@/state/useGameState';
import { TravelManager } from '@/systems/travel/travelManager';
import { validateInitialData } from '@/systems/validation/validateInitialData';
import type { InitialAction } from '@/types/action.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { resolveInteractionPresentation } from './presentation';

const state = () => useGameState.getState();
const read = () => state().interactionSlice.actions.continueInteraction();
const actionId = 'timingTest:action';
const arrivalFrame = 'fixtureHub:timingTest';
const sourceEvent = 'timingTest:source';
const arrivalEvent = 'timingTest:arrival';
const hubTemplate = POI_TEMPLATES.fixtureHub;
const yardTemplate = POI_TEMPLATES.fixtureOpenSite;
const install = (action: InitialAction) => {
  INITIAL_ACTIONS[actionId] = action;
};
const act = () => state().interactionSlice.actions.performAction(actionId);
const nearMidnight = () => {
  const now = new Date(state().world.currentTime);
  state().world.actions.changeTime(24 * 60 - now.getHours() * 60 - now.getMinutes() - 10);
  read();
};

beforeEach(() => {
  useGameState.setState(useGameState.getInitialState(), true);
  state().characters.actions.resetProtagonist();
  state().characters.actions.resetStaminaToMax('protagonist');
  state().world.actions.startNewGame();
  state().inventory.actions.modifyMoney('protagonist', 100);
  state().world.actions.travelToPoi('fixtureHub');
  read();
});

afterEach(() => {
  delete INITIAL_ACTIONS[actionId];
  delete INITIAL_FRAMES[arrivalFrame];
  delete INITIAL_INTERCEPTORS[sourceEvent];
  delete INITIAL_INTERCEPTORS[arrivalEvent];
  POI_TEMPLATES.fixtureHub = hubTemplate;
  POI_TEMPLATES.fixtureOpenSite = yardTemplate;
});

describe('Transition duration and mandatory continuation', () => {
  it('keeps the source scene until continue, then spends four hours before opening a Frame', () => {
    INITIAL_FRAMES[arrivalFrame] = { background: 'arrival-background', narrative: ['Awake.'] };
    install({
      label: 'A fight',
      cost: { time: 5 },
      check: {
        type: 'chance',
        chance: 0,
        onSuccess: {},
        onFail: {
          narrative: ['Knocked out.'],
          transition: { type: 'frame', frameId: arrivalFrame, time: 240 },
        },
      },
    });
    const time = state().world.currentTime;
    const background = resolveInteractionPresentation(state()).background;
    const history = state().interactionSlice.currentInteraction?.log ?? [];
    act();
    expect(state().world.currentTime).toBe(time + 5 * 60000);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub');
    expect(resolveInteractionPresentation(state()).background).toBe(background);
    expect(state().interactionSlice.currentInteraction?.log).toEqual(history);
    expect(state().interactionSlice.currentInteraction?.currentEntry?.blocks).toEqual([
      'Knocked out.',
    ]);
    read();
    expect(state().world.currentTime).toBe(time + 245 * 60000);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(arrivalFrame);
    expect(resolveInteractionPresentation(state())).toMatchObject({
      background: 'arrival-background',
      reading: { mode: 'narrative', blocks: ['Awake.'] },
    });
    expect(state().interactionSlice.currentInteraction?.log).toEqual([
      ...history,
      { blocks: ['Knocked out.'] },
    ]);
    read();
    read();
    expect(state().world.currentTime).toBe(time + 245 * 60000);
    expect(state().interactionSlice.currentInteraction?.currentEntry).toBeNull();
    expect(state().interactionSlice.currentInteraction?.log).toEqual([
      ...history,
      { blocks: ['Knocked out.'] },
      { blocks: ['Awake.'] },
    ]);
  });

  it('blocks context reset, another Action and public time/travel commands while a transition is owed', () => {
    install({
      label: 'Wait',
      result: {
        narrative: ['Leaving.'],
        transition: { type: 'poi', poiId: 'fixtureOpenSite', time: 240 },
      },
    });
    act();
    const pending = state().interactionSlice.pendingTransition;
    const interaction = state().interactionSlice.currentInteraction;
    const time = state().world.currentTime;
    state().interactionSlice.actions.endInteraction();
    state().interactionSlice.actions.returnToPoiContext();
    state().interactionSlice.actions.enterPoiContext('fixtureOpenSite');
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    state().interactionSlice.actions.performAction('fixture:restAtHub');
    state().world.actions.travelToPoi('0-0');
    state().world.actions.changeTime(60);
    state().world.actions.restForMinutes(60);
    state().world.actions.endDay();
    state().ui.openCharacterDetails();
    state().ui.closeCharacterDetails();
    expect(state().interactionSlice.pendingTransition).toBe(pending);
    expect(state().interactionSlice.currentInteraction).toBe(interaction);
    expect(state().world.currentTime).toBe(time);
    expect(state().inventory.containers.protagonist.money).toBe(100);
    read();
    expect(state().world.currentTime).toBe(time + 240 * 60000);
    expect(state().party.currentPartyPosition).toBe('fixtureOpenSite');
  });

  it.each([undefined, 0, 240])(
    'uses %s as a POI duration override, preserving default travel when absent',
    (duration) => {
      const normal = TravelManager.computeTravel('fixtureHub', 'fixtureOpenSite', state()).timeCost;
      install({
        label: 'Move',
        cost: { time: 3 },
        result: {
          narrative: ['Leaving.'],
          transition: { type: 'poi', poiId: 'fixtureOpenSite', time: duration },
        },
      });
      const time = state().world.currentTime;
      act();
      expect(state().world.currentTime).toBe(time + 3 * 60000);
      read();
      expect(state().world.currentTime).toBe(time + (3 + (duration ?? normal)) * 60000);
    },
  );

  it('executes a timed transition without an extra click when the Action has no narrative', () => {
    install({
      label: 'Move',
      cost: { time: 3 },
      result: {
        transition: { type: 'poi', poiId: 'fixtureOpenSite', time: 10 },
      },
    });
    const time = state().world.currentTime;
    act();
    expect(state().world.currentTime).toBe(time + 13 * 60000);
    expect(state().party.currentPartyPosition).toBe('fixtureOpenSite');
    expect(state().interactionSlice.pendingTransition).toBeNull();
  });

  it('continues the NPC scene when cost.time ends the NPC shift', () => {
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    install({
      label: 'Wait',
      cost: { time: 12 * 60 },
      result: {
        narrative: ['The shift has ended.'],
        transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
      },
    });
    act();
    read();
    expect(state().interactionSlice.currentInteraction?.npcId).toBe('fixtureKeeper');
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(
      'fixtureHub/keeper:inner',
    );
    expect(state().interactionSlice.currentInteraction?.poiId).toBe('fixtureHub');
    expect(state().interactionSlice.pendingTransition).toBeNull();
  });

  it('crosses midnight with the source interaction closed and only executes destination entry events', () => {
    nearMidnight();
    INITIAL_INTERCEPTORS[sourceEvent] = {
      result: { effects: [{ type: 'addMoney', amount: 100 }] },
    };
    INITIAL_INTERCEPTORS[arrivalEvent] = { result: { effects: [{ type: 'addMoney', amount: 7 }] } };
    POI_TEMPLATES.fixtureHub = { ...hubTemplate, interceptorIds: [sourceEvent] };
    POI_TEMPLATES.fixtureOpenSite = { ...yardTemplate, interceptorIds: [arrivalEvent] };
    install({
      label: 'A fight',
      cost: { time: 5 },
      result: {
        narrative: ['Knocked out.'],
        transition: { type: 'poi', poiId: 'fixtureOpenSite', time: 240 },
      },
    });
    const time = state().world.currentTime;
    act();
    read();
    expect(state().world.currentTime).toBe(time + 245 * 60000);
    expect(state().party.currentPartyPosition).toBe('fixtureOpenSite');
    expect(state().inventory.containers.protagonist.money).toBe(107);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureOpenSite');
  });

  it('uses removal fallback when the destination expires during the transition', () => {
    nearMidnight();
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureTempSite;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    install({
      label: 'Move',
      result: {
        narrative: ['Leaving.'],
        transition: { type: 'poi', poiId: 'fixtureTempSite', time: 240 },
      },
    });
    const time = state().world.currentTime;
    act();
    read();
    expect(state().world.currentTime).toBe(time + 240 * 60000);
    expect(state().poiSlice.pois.fixtureTempSite).toBeUndefined();
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(state().interactionSlice.currentInteraction?.poiId).toBe('fixtureHub');
    expect(state().interactionSlice.pendingTransition).toBeNull();
  });

  it('does not lose transition time if cost.time expires the source before its result can be shown', () => {
    state().world.actions.travelToPoi('fixtureTempSite');
    read();
    nearMidnight();
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureTempSite;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    install({
      label: 'Move',
      cost: { time: 20 },
      result: {
        narrative: ['Leaving.'],
        transition: { type: 'parentPoi', time: 240 },
      },
    });
    const time = state().world.currentTime;
    act();
    expect(state().world.currentTime).toBe(time + 260 * 60000);
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(state().interactionSlice.pendingTransition).toBeNull();
    expect(state().interactionSlice.currentInteraction?.log).toEqual([]);
    expect(state().interactionSlice.currentInteraction?.currentEntry?.blocks[0]).toBe('Leaving.');
    read();
    expect(state().interactionSlice.currentInteraction?.log).toHaveLength(1);
    expect(state().interactionSlice.currentInteraction?.log[0].blocks[0]).toBe('Leaving.');
  });

  it.each([-1, NaN, Infinity])(
    'rejects invalid transition duration %s in authored data',
    (duration) => {
      const bundle = createInitialDataBundle();
      const issues = validateInitialData({
        ...bundle,
        actions: {
          ...bundle.actions,
          [actionId]: {
            label: 'Invalid',
            result: { transition: { type: 'root', time: duration } },
          },
        },
      });
      expect(issues.some((issue) => issue.path.endsWith('transition.time'))).toBe(true);
    },
  );
});
