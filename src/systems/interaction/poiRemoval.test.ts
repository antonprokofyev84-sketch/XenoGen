import { produce } from 'immer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { useGameState } from '@/state/useGameState';
import { t } from '@/systems/text/i18n';
import type { InitialAction } from '@/types/action.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { resolveInteractionPresentation } from './presentation';
import { resolveInteractionOptions } from './resolveOptions';

const state = () => useGameState.getState();
const interaction = () => state().interactionSlice.currentInteraction;
const read = () => state().interactionSlice.actions.continueInteraction();
const actionId = 'removalTest:action';
const markerId = 'removalTest:mark';
const tailId = 'removalTest:tail';
const hubTemplate = POI_TEMPLATES.fixtureHub;
const act = (action: InitialAction) => {
  INITIAL_ACTIONS[actionId] = action;
  state().interactionSlice.actions.performAction(actionId);
};

beforeEach(() => {
  useGameState.setState(useGameState.getInitialState(), true);
  state().characters.actions.resetProtagonist();
  state().world.actions.startNewGame();
  state().inventory.actions.modifyMoney('protagonist', 100);
  state().world.actions.travelToPoi('fixtureHub');
  read();
});

afterEach(() => {
  delete INITIAL_ACTIONS[actionId];
  delete INITIAL_INTERCEPTORS[markerId];
  delete INITIAL_INTERCEPTORS[tailId];
  POI_TEMPLATES.fixtureHub = hubTemplate;
});

describe('Marked POI interaction and daily cleanup', () => {
  it('removes an unoccupied POI that expires during the current daily cycle', () => {
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureTempSite;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toBeUndefined();
    expect(state().poiSlice.pois.fixtureHub.childPoiIds).not.toContain('fixtureTempSite');
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
  });

  it('shows the destination background when arriving after its content expires', () => {
    state().world.actions.travelToPoi('fixtureOpenSite');
    read();
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureHub;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    act({
      label: 'Return',
      result: { transition: { type: 'parentPoi', time: 2 * 24 * 60 } },
    });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(resolveInteractionPresentation(state()).background).toBe(
      INITIAL_FRAMES.fixtureHub.background,
    );
  });

  it.each(['poi', 'npc'] as const)(
    'replaces an internal %s scene with one exit without deleting the POI',
    (context) => {
      if (context === 'npc') {
        state().interactionSlice.actions.startNpcConversation('keeper', 'fixtureKeeper');
        read();
        state().interactionSlice.actions.performAction('fixture:openKeeperInner');
      } else {
        state().interactionSlice.actions.performAction('fixture:openInnerFrame');
      }
      read();
      const background = interaction()?.currentBackground;
      const history = interaction()?.log;
      state().poiSlice.actions.markPoiForRemoval('fixtureHub');
      expect(state().poiSlice.pois.fixtureHub).toMatchObject({ pendingRemoval: true });
      expect(state().party.currentPartyPosition).toBe('fixtureHub');
      expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
      expect(interaction()?.currentBackground).toBe(background);
      expect(interaction()?.log).toEqual(history);
      expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiPendingRemoval')]);
      read();
      const options = resolveInteractionOptions(state());
      expect(
        Object.values(options.actions)
          .flat()
          .map((action) => action.actionId),
      ).toEqual(['system:leavePoi']);
      expect(options.navigation).toEqual({ canReturnToPoi: false, poiTransitions: [] });

      state().interactionSlice.actions.endNpcConversation();
      expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
      expect(state().inventory.containers.protagonist.money).toBe(100);
      state().interactionSlice.actions.performAction('system:leavePoi');
      expect(state().party.currentPartyPosition).toBe('0-0');
      expect(interaction()).toBeNull();
      expect(state().poiSlice.pois.fixtureHub).toMatchObject({ pendingRemoval: true });
      expect(state().npcSlice.byId.fixtureKeeper.timesMet).toBe(context === 'npc' ? 1 : 0);
    },
  );

  it('confirms the Action result before showing the only exit, paying costs and rewards once', () => {
    const before = state().world.currentTime;
    act({
      label: 'Finish',
      cost: { money: 3, time: 5 },
      result: {
        narrative: ['The task is complete.'],
        effects: [{ type: 'markCurrentPoiForRemoval' }, { type: 'addMoney', amount: 10 }],
      },
    });
    expect(interaction()?.currentEntry?.blocks).toEqual(['The task is complete.']);
    expect(state().inventory.containers.protagonist.money).toBe(107);
    expect(state().world.currentTime).toBe(before + 5 * 60000);
    read();
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(interaction()?.log.at(-1)?.blocks).toEqual(['The task is complete.']);
    read();
    expect(interaction()?.currentEntry).toBeNull();
    expect(state().inventory.containers.protagonist.money).toBe(107);
    expect(state().world.currentTime).toBe(before + 5 * 60000);
  });

  it('discards a local continuation after marking instead of spending its duration', () => {
    const before = state().world.currentTime;
    act({
      label: 'Finish',
      result: {
        narrative: ['Finished.'],
        effects: [{ type: 'markCurrentPoiForRemoval' }],
        transition: { type: 'frame', frameId: 'fixtureHub:inner', time: 240 },
      },
    });
    read();
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(state().interactionSlice.pendingTransition).toBeNull();
    expect(state().world.currentTime).toBe(before);
    expect(state().poiSlice.pois.fixtureHub).toBeDefined();
  });

  it('opens the only exit when the POI expires during a local transition', () => {
    state().world.actions.travelToPoi('fixtureTempSite');
    read();
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureTempSite;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    const before = state().world.currentTime;
    act({
      label: 'Wait',
      result: {
        narrative: ['You settle down to wait.'],
        transition: { type: 'root', time: 2 * 1440 },
      },
    });
    expect(state().world.currentTime).toBe(before);

    read();
    expect(state().world.currentTime).toBe(before + 2 * 1440 * 60000);
    expect(state().party.currentPartyPosition).toBe('fixtureTempSite');
    expect(state().poiSlice.pois.fixtureTempSite).toMatchObject({ pendingRemoval: true });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiPendingRemoval')]);
    expect(state().interactionSlice.pendingTransition).toBeNull();
  });

  it('keeps an occupied expired POI across cycles and removes it after leaving', () => {
    state().world.actions.travelToPoi('fixtureTempSite');
    read();
    useGameState.setState(
      produce(state(), (draft) => {
        const poi = draft.poiSlice.pois.fixtureTempSite;
        if (isNonCellNode(poi)) poi.details.lifetimeDaysLeft = 1;
      }),
    );
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toMatchObject({ pendingRemoval: true });
    expect(state().party.currentPartyPosition).toBe('fixtureTempSite');
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toMatchObject({ pendingRemoval: true });
    expect(state().party.currentPartyPosition).toBe('fixtureTempSite');
    read();
    state().interactionSlice.actions.performAction('system:leavePoi');
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(interaction()?.poiId).toBe('fixtureHub');
    expect(state().poiSlice.pois.fixtureTempSite).toBeDefined();
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toBeUndefined();
  });

  it('protects the occupied path while cleaning other branches, then releases each departed POI', () => {
    state().world.actions.travelToPoi('fixtureTempSite');
    read();
    state().inventory.actions.createContainer('fixtureTempSite', { money: 7 });
    state().inventory.actions.createContainer('fixtureOpenSite', { money: 5 });
    state().poiSlice.actions.markPoiForRemoval('fixtureHub');
    expect(state().poiSlice.pois.fixtureHub).toMatchObject({ pendingRemoval: true });
    expect(state().poiSlice.pois.fixtureTempSite).toMatchObject({ pendingRemoval: true });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toBeDefined();
    expect(state().poiSlice.pois.fixtureHub).toBeDefined();
    expect(state().poiSlice.pois.fixtureHub.childPoiIds).toContain('fixtureTempSite');
    expect(state().poiSlice.pois['0-0'].childPoiIds).toContain('fixtureHub');
    expect(state().poiSlice.pois.fixtureOpenSite).toBeUndefined();
    expect(state().inventory.containers.fixtureOpenSite).toBeUndefined();
    expect(state().inventory.containers.fixtureTempSite).toBeDefined();
    expect(state().party.currentPartyPosition).toBe('fixtureTempSite');

    read();
    state().interactionSlice.actions.performAction('system:leavePoi');
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureTempSite).toBeUndefined();
    expect(state().inventory.containers.fixtureTempSite).toBeUndefined();
    expect(state().poiSlice.pois.fixtureHub).toBeDefined();
    expect(state().poiSlice.pois.fixtureHub.childPoiIds).not.toContain('fixtureTempSite');

    read();
    state().interactionSlice.actions.performAction('system:leavePoi');
    expect(state().party.currentPartyPosition).toBe('0-0');
    state().world.actions.endDay();
    expect(state().poiSlice.pois.fixtureHub).toBeUndefined();
    expect(state().ui.currentScreen).toBe('strategicMap');
    expect(interaction()).toBeNull();
  });

  it('stops the entry queue when an Interceptor marks the POI', () => {
    INITIAL_INTERCEPTORS[markerId] = {
      priority: 200,
      result: { effects: [{ type: 'markCurrentPoiForRemoval' }] },
    };
    INITIAL_INTERCEPTORS[tailId] = {
      priority: 100,
      result: { effects: [{ type: 'addMoney', amount: 77 }] },
    };
    POI_TEMPLATES.fixtureHub = { ...hubTemplate, interceptorIds: [markerId, tailId] };
    state().world.actions.travelToPoi('fixtureOpenSite');
    read();
    state().world.actions.travelToPoi('fixtureHub');
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(state().inventory.containers.protagonist.money).toBe(100);
    read();
    expect(state().inventory.containers.protagonist.money).toBe(100);
  });
});
