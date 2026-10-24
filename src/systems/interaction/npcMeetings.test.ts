import { beforeEach, describe, expect, it } from 'vitest';

import { useGameState } from '@/state/useGameState';

const getState = () => useGameState.getState();
const keeper = () => getState().npcSlice.byId.fixtureKeeper;
const enterKeeper = () =>
  getState().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');

describe('NPC meetings at interaction boundaries', () => {
  beforeEach(() => {
    useGameState.setState(useGameState.getInitialState(), true);
    getState().characters.actions.resetProtagonist();
    getState().world.actions.startNewGame();
    getState().occupancySlice.actions.assignNpcToSlot('fixtureHub', 'visitor', 'fixtureVisitorA');
    getState().world.actions.travelToPoi('fixtureHub');
  });

  it('counts a meeting on return to the POI, not on entry or local Frame changes', () => {
    enterKeeper();
    expect(keeper().timesMet).toBe(0);

    getState().interactionSlice.actions.performAction('fixture:openKeeperInner');
    getState().interactionSlice.actions.performAction('fixture:backToRoot');
    expect(keeper().timesMet).toBe(0);

    getState().interactionSlice.actions.returnToPoiContext();
    expect(keeper().timesMet).toBe(1);
    expect(keeper().lastDateMet).toBe(getState().world.currentTime);
  });

  it('does not count reopening the same NPC context as completing a meeting', () => {
    enterKeeper();
    enterKeeper();
    expect(keeper().timesMet).toBe(0);
    expect(keeper().lastDateMet).toBeNull();
  });

  it('counts at most once per calendar day and updates the last meeting time', () => {
    enterKeeper();
    getState().interactionSlice.actions.returnToPoiContext();
    getState().world.actions.changeTime(1);
    enterKeeper();
    getState().interactionSlice.actions.returnToPoiContext();

    expect(keeper().timesMet).toBe(1);
    expect(keeper().lastDateMet).toBe(getState().world.currentTime);

    getState().world.actions.changeTime(24 * 60);
    enterKeeper();
    getState().interactionSlice.actions.returnToPoiContext();
    expect(keeper().timesMet).toBe(2);
  });

  it('counts a meeting when leaving the POI through the world command', () => {
    enterKeeper();
    getState().world.actions.travelToPoi('0-0');
    expect(keeper().timesMet).toBe(1);
    expect(getState().interactionSlice.currentInteraction).toBeNull();
  });

  it('counts a meeting on explicit interaction end only once', () => {
    enterKeeper();
    getState().interactionSlice.actions.endInteraction();
    getState().interactionSlice.actions.endInteraction();
    expect(keeper().timesMet).toBe(1);
  });

  it('counts the NPC being left when switching directly to another occupied slot', () => {
    enterKeeper();
    getState().interactionSlice.actions.enterSlotContext('visitor', 'fixtureVisitorA');
    expect(keeper().timesMet).toBe(1);
    expect(getState().npcSlice.byId.fixtureVisitorA.timesMet).toBe(0);
  });

  it('counts a meeting when force exit returns the visitor to the POI', () => {
    getState().interactionSlice.actions.enterSlotContext('visitor', 'fixtureVisitorA');
    getState().interactionSlice.actions.performAction('fixture:provokeVisitor');
    expect(getState().interactionSlice.currentInteraction?.npcId).toBeUndefined();
    expect(getState().npcSlice.byId.fixtureVisitorA.timesMet).toBe(1);
  });

  it('counts a meeting when a time-slot change invalidates the NPC context', () => {
    enterKeeper();
    getState().world.actions.changeTime(12 * 60);
    expect(getState().interactionSlice.currentInteraction?.npcId).toBeUndefined();
    expect(keeper().timesMet).toBe(1);
  });

  it('counts a meeting when the current POI is removed at the cleanup boundary', () => {
    enterKeeper();
    getState().poiSlice.actions.markPoiForRemoval('fixtureHub');
    expect(keeper().timesMet).toBe(0);

    getState().poiSlice.actions.sweepPendingRemovals();
    expect(getState().interactionSlice.currentInteraction).toBeNull();
    expect(keeper().timesMet).toBe(1);
  });
});
