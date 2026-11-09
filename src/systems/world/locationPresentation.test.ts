import { beforeEach, describe, expect, it } from 'vitest';

import { useGameState } from '@/state/useGameState';
import { resolveInteractionPresentation } from '@/systems/interaction/presentation';
import { resolveInteractionOptions } from '@/systems/interaction/resolveOptions';

import { resolveLocationPresentation, resolvePoiDisplayName } from './locationPresentation';

const state = () => useGameState.getState();
const read = () => state().interactionSlice.actions.continueInteraction();

beforeEach(() => {
  useGameState.setState(useGameState.getInitialState(), true);
  state().characters.actions.resetProtagonist();
  state().characters.actions.resetStaminaToMax('protagonist');
  state().world.actions.startNewGame();
});

describe('Shared location HUD and occupant presentation', () => {
  it('resolves authored titles, legacy localized titles and unknown template IDs consistently', () => {
    expect(resolvePoiDisplayName('fixtureHub')).toBe('The Red Boar');
    expect(resolvePoiDisplayName('test_tavern')).toBe('Test Tavern');
    expect(resolvePoiDisplayName('unknownPoiTemplate')).toBe('unknownPoiTemplate');
  });

  it.each([
    ['keeper', 'fixtureKeeper'],
    ['visitor', 'fixtureVisitorA'],
  ])('shows each Action only once in the %s root', (slotId, npcId) => {
    state().occupancySlice.actions.assignNpcToSlot('fixtureHub', slotId, npcId);
    state().world.actions.travelToPoi('fixtureHub');
    read();
    state().interactionSlice.actions.enterSlotContext(slotId, npcId);
    read();
    const ids = Object.values(resolveInteractionOptions(state()).actions)
      .flat()
      .map((action) => action.actionId);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps unvisited cell parameters unknown, then shows effective POI levels', () => {
    expect(resolveLocationPresentation(state(), '0-0').levels).toBeUndefined();
    state().world.actions.travelToPoi('fixtureHub');
    expect(resolveLocationPresentation(state(), 'fixtureHub')).toMatchObject({
      title: 'The Red Boar',
      parentTitle: 'Plains (0, 0)',
      status: 'Open',
      levels: { prosperity: 4, techLevel: 2, contamination: 0, threat: 1 },
    });
    // A child uses the root cell, not its parent's local prosperity modifier.
    expect(resolveLocationPresentation(state(), 'fixtureOpenSite').levels?.prosperity).toBe(3);
  });

  it('retains the occupants during an NPC conversation and an internal Frame', () => {
    state().world.actions.travelToPoi('fixtureHub');
    read();
    const slots = resolveInteractionPresentation(state()).portraits;
    expect(slots.some((slot) => slot.npcId === 'fixtureKeeper')).toBe(true);
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    expect(resolveInteractionPresentation(state()).portraits).toEqual(slots);
    expect(resolveInteractionOptions(state()).navigation.npcSlots).toEqual(slots);
    state().interactionSlice.actions.performAction('fixture:openKeeperInner');
    const internal = resolveInteractionPresentation(state());
    expect(internal.portraits).toEqual(slots);
    expect(internal.isRoot).toBe(false);
    expect(resolveInteractionOptions(state()).navigation.canReturnToPoi).toBe(false);
  });

  it('switches root NPCs through the existing meeting-registration pipeline', () => {
    state().world.actions.travelToPoi('fixtureHub');
    read();
    state().interactionSlice.actions.enterSlotContext('keeper', 'fixtureKeeper');
    read();
    state().interactionSlice.actions.enterSlotContext('resident', 'fixtureResident');
    expect(state().npcSlice.byId.fixtureKeeper.timesMet).toBe(1);
    expect(state().interactionSlice.currentInteraction?.npcId).toBe('fixtureResident');
    expect(
      resolveInteractionPresentation(state()).portraits.some(
        (slot) => slot.npcId === 'fixtureResident',
      ),
    ).toBe(true);
  });

  it('preserves collapsed HUD state across inventory and screen changes', () => {
    state().ui.toggleLocationHud();
    state().ui.openCharacterDetails();
    state().ui.closeCharacterDetails();
    state().ui.goToScreen('poiView');
    expect(state().ui.isLocationHudCollapsed).toBe(true);
    state().ui.toggleLocationHud();
    expect(state().ui.isLocationHudCollapsed).toBe(false);
  });
});
