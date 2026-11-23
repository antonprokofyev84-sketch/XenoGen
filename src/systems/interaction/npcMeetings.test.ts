import { beforeEach, describe, expect, it } from 'vitest';

import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import { useGameState } from '@/state/useGameState';

import { resolveCurrentNpcEffectiveRelation } from './effectiveRelation';

const getState = () => useGameState.getState();
const keeper = () => getState().npcSlice.byId.fixtureKeeper;
const enterKeeper = () => {
  getState().interactionSlice.actions.startNpcConversation('keeper', 'fixtureKeeper');
  getState().interactionSlice.actions.continueInteraction();
};

describe('NPC meetings at interaction boundaries', () => {
  beforeEach(() => {
    useGameState.setState(useGameState.getInitialState(), true);
    getState().characters.actions.resetProtagonist();
    getState().world.actions.startNewGame();
    getState().occupancySlice.actions.assignNpcToSlot('fixtureHub', 'visitor', 'fixtureVisitorA');
    getState().world.actions.travelToPoi('fixtureHub');
    getState().interactionSlice.actions.continueInteraction();
  });

  it('counts a meeting on return to the POI, not on entry or local Frame changes', () => {
    enterKeeper();
    expect(keeper().timesMet).toBe(0);

    getState().interactionSlice.actions.performAction('fixture:openKeeperInner');
    getState().interactionSlice.actions.continueInteraction();
    getState().interactionSlice.actions.performAction('fixture:backToRoot');
    expect(keeper().timesMet).toBe(0);

    getState().interactionSlice.actions.endNpcConversation();
    expect(keeper().timesMet).toBe(1);
    expect(keeper().lastDateMet).toBe(getState().world.currentTime);
  });

  it('does not count reopening the same NPC context as completing a meeting', () => {
    enterKeeper();
    enterKeeper();
    expect(keeper().timesMet).toBe(0);
    expect(keeper().lastDateMet).toBeNull();
  });

  it('resolves relation for the NPC stored in the current interaction', () => {
    enterKeeper();
    getState().npcSlice.actions.setNpcAffection('fixtureKeeper', 37);

    expect(resolveCurrentNpcEffectiveRelation(getState())).toBe(37);
  });

  it('counts at most once per calendar day and updates the last meeting time', () => {
    enterKeeper();
    getState().interactionSlice.actions.endNpcConversation();
    getState().world.actions.changeTime(1);
    enterKeeper();
    getState().interactionSlice.actions.endNpcConversation();

    expect(keeper().timesMet).toBe(1);
    expect(keeper().lastDateMet).toBe(getState().world.currentTime);

    getState().world.actions.changeTime(24 * 60);
    enterKeeper();
    getState().interactionSlice.actions.endNpcConversation();
    expect(keeper().timesMet).toBe(2);
  });

  it('counts a meeting when leaving the POI through the world command', () => {
    enterKeeper();
    getState().world.actions.travelToPoi('0-0');
    expect(keeper().timesMet).toBe(1);
    expect(getState().interactionSlice.currentInteraction).toBeNull();
  });

  it('counts the NPC being left when switching directly to another occupied slot', () => {
    enterKeeper();
    getState().interactionSlice.actions.startNpcConversation('visitor', 'fixtureVisitorA');
    expect(keeper().timesMet).toBe(1);
    expect(getState().npcSlice.byId.fixtureVisitorA.timesMet).toBe(0);
  });

  it('counts a meeting when force exit returns the visitor to the POI', () => {
    getState().interactionSlice.actions.startNpcConversation('visitor', 'fixtureVisitorA');
    getState().interactionSlice.actions.continueInteraction();
    getState().interactionSlice.actions.performAction('fixture:provokeVisitor');
    getState().interactionSlice.actions.continueInteraction();
    expect(getState().interactionSlice.currentInteraction?.npcId).toBeUndefined();
    expect(getState().npcSlice.byId.fixtureVisitorA.timesMet).toBe(1);
  });

  it('counts a meeting on confirmation of the unavailable-context exit', () => {
    enterKeeper();
    getState().world.actions.changeTime(12 * 60);
    expect(getState().interactionSlice.currentInteraction?.activeFrameId).toBe(
      CONTEXT_EXIT_FRAMES.npcLeft,
    );
    expect(keeper().timesMet).toBe(0);
    getState().interactionSlice.actions.continueInteraction();
    getState().interactionSlice.actions.performAction('system:endUnavailableConversation');
    expect(getState().interactionSlice.currentInteraction?.npcId).toBeUndefined();
    expect(keeper().timesMet).toBe(1);
  });

  it('counts the meeting on leaving a marked POI, not while day cleanup protects it', () => {
    enterKeeper();
    getState().poiSlice.actions.markPoiForRemoval('fixtureHub');
    expect(keeper().timesMet).toBe(0);

    getState().world.actions.endDay();
    expect(getState().interactionSlice.currentInteraction?.npcId).toBe('fixtureKeeper');
    expect(keeper().timesMet).toBe(0);
    getState().interactionSlice.actions.continueInteraction();
    getState().interactionSlice.actions.performAction('system:leavePoi');
    expect(getState().interactionSlice.currentInteraction).toBeNull();
    expect(keeper().timesMet).toBe(1);
  });
});
