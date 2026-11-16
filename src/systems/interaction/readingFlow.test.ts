import { produce } from 'immer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { createInitialDataBundle } from '@/data/initial/bundle';
import { useGameState } from '@/state/useGameState';
import { resolveCharacterSilhouette } from '@/systems/characters/characterImageFallback';
import { validateInitialData } from '@/systems/validation/validateInitialData';
import type { InitialAction } from '@/types/action.types';

import { continueInteraction, performAction } from './performAction';
import { resolveInteractionPresentation } from './presentation';
import { resolveInteractionOptions } from './resolveOptions';

const state = () => useGameState.getState();
const read = () => state().interactionSlice.actions.continueInteraction();
const reading = () => resolveInteractionPresentation(state()).reading;
const count = (id: string) =>
  state()
    .inventory.containers.protagonist.items.filter((item) => item.templateId === id)
    .reduce((sum, item) => sum + item.quantity, 0);
const testId = 'readingTest:action';
const install = (action: InitialAction) => {
  INITIAL_ACTIONS[testId] = action;
};
const act = () => state().interactionSlice.actions.performAction(testId);

describe('Immediate Action costs and deferred transitions', () => {
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
  });
  afterEach(() => {
    delete INITIAL_ACTIONS[testId];
  });

  it('does not allow an Action until the entry text is read', () => {
    const time = state().world.currentTime;
    state().interactionSlice.actions.performAction('fixture:restAtHub');
    expect(state().inventory.containers.protagonist.money).toBe(100);
    expect(state().world.currentTime).toBe(time);
    read();
    expect(reading().mode).toBe('actions');
  });

  it('pays all costs once before reading, then spends transition time on continue', () => {
    read();
    const cost = vi.fn(() => 7);
    const rng = vi.fn(() => 0.1);
    install({
      label: 'Test',
      cost: { money: cost, stamina: 2, time: 15, items: [{ itemId: 'scrap', count: 2 }] },
      executionLimit: { total: 1 },
      check: {
        type: 'chance',
        chance: 0.5,
        onSuccess: {
          narrative: ['Результат'],
          effects: [{ type: 'addItem', itemId: 'food', count: 1 }],
          transition: { type: 'frame', frameId: 'fixtureHub:inner', time: 30 },
        },
        onFail: { narrative: ['Провал'] },
      },
    });
    const before = {
      time: state().world.currentTime,
      stamina: state().characters.byId.protagonist.stamina,
      food: count('food'),
    };
    useGameState.setState(
      produce(state(), (draft) => {
        performAction(draft, testId, rng);
      }),
    );
    expect(cost).toHaveBeenCalledTimes(1);
    expect(rng).toHaveBeenCalledTimes(1);
    expect(state().inventory.containers.protagonist.money).toBe(93);
    expect(count('scrap')).toBe(3);
    expect(count('food')).toBe(before.food + 1);
    expect(state().characters.byId.protagonist.stamina).toBe(before.stamina - 2);
    expect(state().world.currentTime).toBe(before.time + 15 * 60000);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub');
    act();
    expect(state().inventory.containers.protagonist.money).toBe(93);
    useGameState.setState(
      produce(state(), (draft) => {
        draft.ui.interactionLogCursor = draft.interactionSlice.currentInteraction!.log.length;
        continueInteraction(draft, rng);
      }),
    );
    expect(state().world.currentTime).toBe(before.time + 45 * 60000);
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe('fixtureHub:inner');
    read();
    read();
    expect(state().world.currentTime).toBe(before.time + 45 * 60000);
    expect(cost).toHaveBeenCalledTimes(1);
    expect(rng).toHaveBeenCalledTimes(1);
    expect(
      state().interactionSlice.executionTotalsBySubject['poi:fixtureHub']?.actions[testId],
    ).toBe(1);
  });

  it('finishes a failed check with the same paid cost and no second roll', () => {
    read();
    install({
      label: 'Test',
      cost: { money: 9, time: 5 },
      check: {
        type: 'chance',
        chance: 0,
        onSuccess: {},
        onFail: { narrative: ['Не получилось.'] },
      },
    });
    const before = state().world.currentTime;
    act();
    expect(state().inventory.containers.protagonist.money).toBe(91);
    expect(state().world.currentTime).toBe(before + 5 * 60000);
    read();
    read();
    expect(state().world.currentTime).toBe(before + 5 * 60000);
    expect(state().inventory.containers.protagonist.money).toBe(91);
  });

  it('finishes without an extra click when the result has no narrative', () => {
    read();
    install({ label: 'Test', cost: { time: 3 }, result: {} });
    const before = state().world.currentTime;
    act();
    expect(state().world.currentTime).toBe(before + 3 * 60000);
    expect(reading().mode).toBe('actions');
  });

  it('does not repeat root narrative when returning from an internal Frame', () => {
    read();
    state().interactionSlice.actions.performAction('fixture:openInnerFrame');
    read();
    const length = state().interactionSlice.currentInteraction?.log.length;
    state().interactionSlice.actions.performAction('fixture:backToRoot');
    expect(state().interactionSlice.currentInteraction?.log.length).toBe(length);
    expect(reading().mode).toBe('actions');
  });

  it('keeps the original POI and result until deferred travel, with one reward', () => {
    read();
    state().world.actions.travelToPoi('fixtureTempSite');
    read();
    const before = count('scrap');
    state().interactionSlice.actions.performAction('fixture:lootAndLeave');
    expect(state().party.currentPartyPosition).toBe('fixtureTempSite');
    expect(state().poiSlice.pois.fixtureTempSite).toMatchObject({ pendingRemoval: true });
    expect(count('scrap')).toBe(before + 2);
    read();
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(state().interactionSlice.currentInteraction?.poiId).toBe('fixtureHub');
    read();
    expect(count('scrap')).toBe(before + 2);
  });

  it('remembers forceExit immediately and waits through internal Frames', () => {
    read();
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    install({
      label: 'Test',
      result: {
        narrative: ['Конфликт'],
        effects: [{ type: 'modifyTension', delta: 100 }],
        transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
      },
    });
    act();
    expect(state().interactionSlice.currentInteraction?.pendingEvents).toEqual([
      { type: 'forceExit' },
    ]);
    read();
    read();
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(
      'fixtureHub/keeper:inner',
    );
    install({
      label: 'Test',
      result: { effects: [{ type: 'modifyTension', delta: -100 }], transition: { type: 'root' } },
    });
    act();
    expect(state().interactionSlice.currentInteraction?.activeFrameId).toBe(
      'fixtureHub/keeper:forceExit',
    );
  });

  it('preserves reading through inventory after the full Rest cost has already been paid', () => {
    read();
    const time = state().world.currentTime;
    state().characters.actions.changeStamina('protagonist', -40);
    const stamina = state().characters.byId.protagonist.stamina;
    const snapshots: { time: number; stamina: number }[] = [];
    const unsubscribe = useGameState.subscribe((next) =>
      snapshots.push({
        time: next.world.currentTime,
        stamina: next.characters.byId.protagonist.stamina,
      }),
    );
    state().interactionSlice.actions.performAction('fixture:restAtHub');
    unsubscribe();
    expect(snapshots).toEqual([{ time: time + 120 * 60000, stamina: stamina + 40 }]);
    const before = state().interactionSlice.currentInteraction;
    expect(state().world.currentTime).toBe(time + 120 * 60000);
    expect(state().characters.byId.protagonist.stamina).toBe(stamina + 40);
    state().ui.openCharacterDetails();
    state().ui.closeCharacterDetails();
    expect(state().ui.currentScreen).toBe('poiView');
    expect(state().interactionSlice.currentInteraction).toBe(before);
    expect(state().world.currentTime).toBe(time + 120 * 60000);
    read();
    expect(state().world.currentTime).toBe(time + 120 * 60000);
  });

  it('cannot avoid a paid time cost by ending the interaction before reading', () => {
    read();
    const time = state().world.currentTime;
    state().interactionSlice.actions.performAction('fixture:restAtHub');
    state().interactionSlice.actions.endInteraction();
    state().interactionSlice.actions.enterPoiContext('fixtureOpenSite');
    read();
    expect(state().world.currentTime).toBe(time + 120 * 60000);
  });

  it('uses current reading for the speaker and removes speaker-only figures in actions mode', () => {
    read();
    state().occupancySlice.actions.assignNpcToSlot('fixtureHub', 'visitor', 'fixtureVisitorA');
    state().occupancySlice.actions.refreshOccupancy();
    state().interactionSlice.actions.enterSlotContext('visitor', 'fixtureVisitorA');
    expect(resolveInteractionPresentation(state()).figure?.npcId).toBe('fixtureVisitorA');
    read();
    expect(resolveInteractionPresentation(state()).figure).toBeUndefined();
  });

  it('keeps the resident female silhouette visible during narration and Actions', () => {
    read();
    state().interactionSlice.actions.enterSlotContext('resident', 'fixtureResident');
    expect(state().interactionSlice.currentInteraction?.npcId).toBe('fixtureResident');
    const presentation = resolveInteractionPresentation(state());
    expect(presentation.figure?.imageUrl).toBe(resolveCharacterSilhouette('female'));
    expect(presentation.showPortraits).toBe(true);
    read();
    expect(resolveInteractionPresentation(state()).figure?.imageUrl).toBe(
      resolveCharacterSilhouette('female'),
    );
  });

  it('preserves a pending result while viewing the map and returning to the POI', () => {
    read();
    const before = state().world.currentTime;
    state().interactionSlice.actions.performAction('fixture:restAtHub');
    const pending = state().interactionSlice.currentInteraction;
    expect(reading().mode).toBe('narrative');
    state().ui.goToScreen('strategicMap');
    state().ui.goToScreen('poiView');
    expect(state().interactionSlice.currentInteraction).toBe(pending);
    expect(state().world.currentTime).toBe(before + 120 * 60000);
    read();
    expect(state().world.currentTime).toBe(before + 120 * 60000);
    expect(state().inventory.containers.protagonist.money).toBe(90);
  });

  it('resolves button money and explanations without exposing hidden Actions', () => {
    read();
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    const options = resolveInteractionOptions(state());
    const drink = options.actions.slot.find((option) => option.actionId === 'fixture:buyDrink');
    expect(drink?.moneyCost).toBeGreaterThan(0);
    expect(drink?.hints.some((hint) => hint.includes('stamina'))).toBe(true);
    expect(drink).not.toHaveProperty('time');
    expect(drink).not.toHaveProperty('chance');
  });

  it('evicts the party to its first surviving parent during end-of-day cleanup', () => {
    read();
    state().world.actions.travelToPoi('fixtureTempSite');
    state().poiSlice.actions.markPoiForRemoval('fixtureTempSite');
    state().world.actions.endDay();
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(state().interactionSlice.currentInteraction?.poiId).toBe('fixtureHub');
    expect(state().poiSlice.pois.fixtureTempSite).toBeUndefined();
    state().poiSlice.actions.markPoiForRemoval('fixtureHub');
    state().world.actions.endDay();
    expect(state().party.currentPartyPosition).toBe('0-0');
    expect(state().ui.currentScreen).toBe('strategicMap');
  });

  it('keeps authored content valid', () => {
    expect(validateInitialData(createInitialDataBundle())).toEqual([]);
  });
});
