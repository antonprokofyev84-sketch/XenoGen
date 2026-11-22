import { produce } from 'immer';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { CONTEXT_EXIT_FRAMES } from '@/data/initial/interactionExits';
import { INITIAL_INTERCEPTORS } from '@/data/initial/interceptors';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { useGameState } from '@/state/useGameState';
import { t } from '@/systems/text/i18n';
import type { InitialAction } from '@/types/action.types';
import { isNonCellNode } from '@/types/worldNode.types';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

import { resolveInteractionPresentation } from './presentation';
import { resolveInteractionOptions } from './resolveOptions';

const state = () => useGameState.getState();
const interaction = () => state().interactionSlice.currentInteraction;
const read = () => state().interactionSlice.actions.continueInteraction();
const actionId = 'contextTest:action';
const entryId = 'contextTest:entry';
const hubTemplate = POI_TEMPLATES.fixtureHub;
const act = (action: InitialAction) => {
  INITIAL_ACTIONS[actionId] = action;
  state().interactionSlice.actions.performAction(actionId);
};
const enterKeeper = () => {
  state().interactionSlice.actions.startNpcConversation('keeper', 'fixtureKeeper');
  read();
};
const closeAfter = (minutes: number) => {
  const slot = resolveTimeOfDay(state().world.currentTime + minutes * 60000);
  useGameState.setState(
    produce(state(), (draft) => {
      const poi = draft.poiSlice.pois.fixtureHub;
      if (!isNonCellNode(poi) || !poi.schedule) throw new Error('Expected a scheduled POI');
      poi.schedule[slot] = 'closed';
    }),
  );
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
  delete INITIAL_INTERCEPTORS[entryId];
  POI_TEMPLATES.fixtureHub = hubTemplate;
});

describe('Context validity at the root boundary', () => {
  it('restores daily tension before continuing NPC actions in an internal scene', () => {
    enterKeeper();
    state().interactionSlice.actions.performAction('fixture:openKeeperInner');
    read();
    useGameState.setState(
      produce(state(), (draft) => {
        draft.npcSlice.byId.fixtureKeeper.affection = -50;
      }),
    );
    state().world.actions.changeTime(24 * 60);
    const baseline = state().interactionSlice.dailyMemoryBySubject['npc:fixtureKeeper']?.tension;
    expect(baseline).toBeGreaterThanOrEqual(30);
    expect(baseline).toBeLessThanOrEqual(70);
    act({ label: 'Calm down', result: { effects: [{ type: 'modifyTension', delta: -5 }] } });
    expect(state().interactionSlice.dailyMemoryBySubject['npc:fixtureKeeper']?.tension).toBe(
      baseline! - 5,
    );
    expect(interaction()?.activeFrameId).toBe('fixtureHub/keeper:inner');
  });

  it('preserves the scene within a POI and clears its background when travelling to another POI', () => {
    const background = interaction()?.currentBackground;
    expect(background).toBeDefined();
    enterKeeper();
    expect(interaction()?.currentBackground).toBe(background);
    state().interactionSlice.actions.performAction('fixture:leaveSlot');
    expect(interaction()?.currentBackground).toBe(background);
    read();
    state().world.actions.travelToPoi('fixtureClosedSite');
    expect(state().party.currentPartyPosition).toBe('fixtureClosedSite');
    expect(interaction()?.currentBackground).toBeUndefined();
  });

  it.each([
    ['cost', 720],
    ['transition', 720],
    ['cost', 2400],
    ['transition', 2400],
  ] as const)(
    'finishes the current text after %s of %i minutes, then reports the NPC departure',
    (timeSource, duration) => {
      enterKeeper();
      const before = state().world.currentTime;
      act({
        label: 'Wait together',
        cost: { money: 3, time: timeSource === 'cost' ? duration : 0 },
        result: {
          narrative: ['The conversation continues.'],
          transition: {
            type: 'frame',
            frameId: 'fixtureHub/keeper:inner',
            time: timeSource === 'transition' ? duration : 0,
          },
        },
      });
      read();
      expect(state().world.currentTime).toBe(before + duration * 60000);
      expect(state().occupancySlice.slotOccupants.fixtureHub?.keeper).toBeUndefined();
      expect(interaction()?.npcId).toBe('fixtureKeeper');
      expect(interaction()?.activeFrameId).toBe('fixtureHub/keeper:inner');
      read();
      expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.npcLeft);
      expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.npcLeft')]);
      expect(state().npcSlice.byId.fixtureKeeper.timesMet).toBe(0);
      read();
      const options = resolveInteractionOptions(state());
      expect(
        Object.values(options.actions)
          .flat()
          .map((action) => action.actionId),
      ).toEqual(['system:endUnavailableConversation']);
      expect(options.navigation).toEqual({ canReturnToPoi: false, poiTransitions: [] });
      expect(resolveInteractionPresentation(state()).isRoot).toBe(false);
      state().interactionSlice.actions.performAction('system:endUnavailableConversation');
      expect(interaction()?.npcId).toBeUndefined();
      expect(interaction()?.activeFrameId).toBe('fixtureHub');
      expect(state().npcSlice.byId.fixtureKeeper.timesMet).toBe(1);
      expect(state().inventory.containers.protagonist.money).toBe(97);
      expect(state().world.currentTime).toBe(before + duration * 60000);
    },
  );

  it.each(['changeTime', 'restForMinutes'] as const)(
    'opens the POI exit when %s closes it during an internal Frame',
    (command) => {
      state().interactionSlice.actions.performAction('fixture:openInnerFrame');
      read();
      closeAfter(12 * 60);
      state().world.actions[command](12 * 60);
      expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiClosed);
      expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiClosed')]);
      read();
      expect(Object.values(resolveInteractionOptions(state()).actions).flat()).toHaveLength(1);
      state().interactionSlice.actions.performAction('system:leavePoi');
      expect(state().party.currentPartyPosition).toBe('0-0');
      expect(interaction()).toBeNull();
      expect(state().ui.currentScreen).toBe('strategicMap');
    },
  );

  it('checks a root Action without a transition only after its result is confirmed', () => {
    enterKeeper();
    act({
      label: 'Wait',
      cost: { time: 12 * 60 },
      result: { narrative: ['You finish waiting.'] },
    });
    expect(interaction()?.activeFrameId).toBe('fixtureHub/keeper');
    expect(interaction()?.currentEntry?.blocks).toEqual(['You finish waiting.']);
    read();
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.npcLeft);
    expect(interaction()?.log.at(-1)?.blocks).toEqual(['You finish waiting.']);
  });

  it('checks closure immediately for a root Action without narrative', () => {
    closeAfter(12 * 60);
    act({ label: 'Wait', cost: { time: 12 * 60 }, result: {} });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiClosed);
  });

  it.each(['npcLeft', 'poiClosed'] as const)(
    'checks %s after a timed Frame transition to the dialogue root',
    (exitReason) => {
      enterKeeper();
      state().interactionSlice.actions.performAction('fixture:openKeeperInner');
      read();
      if (exitReason === 'poiClosed') closeAfter(12 * 60);
      const before = state().world.currentTime;
      act({
        label: 'Finish talking',
        result: {
          narrative: ['The conversation draws to a close.'],
          transition: { type: 'frame', frameId: 'fixtureHub/keeper', time: 12 * 60 },
        },
      });
      expect(state().world.currentTime).toBe(before);
      expect(interaction()?.activeFrameId).toBe('fixtureHub/keeper:inner');

      read();
      expect(state().world.currentTime).toBe(before + 12 * 60 * 60000);
      expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES[exitReason]);
      expect(interaction()?.currentEntry?.blocks).toEqual([t(`interactionUi.${exitReason}`)]);
      expect(interaction()?.log.at(-1)?.blocks).toEqual(['The conversation draws to a close.']);
    },
  );

  it('prioritizes POI closure over NPC departure and the pending force exit', () => {
    enterKeeper();
    state().interactionSlice.actions.performAction('fixture:openKeeperInner');
    read();
    closeAfter(12 * 60);
    act({
      label: 'Wait',
      cost: { time: 12 * 60 },
      result: { effects: [{ type: 'modifyTension', delta: 100 }] },
    });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiClosed);
    expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiClosed')]);
    read();
    state().interactionSlice.actions.performAction('system:leavePoi');
    expect(state().npcSlice.byId.fixtureKeeper.timesMet).toBe(1);
    expect(interaction()).toBeNull();
  });

  it('does not append ordinary POI root text when ending a conversation in a closed POI', () => {
    enterKeeper();
    state().interactionSlice.actions.performAction('fixture:openKeeperInner');
    read();
    closeAfter(12 * 60);
    state().world.actions.changeTime(12 * 60);
    state().interactionSlice.actions.performAction('fixture:leaveSlot');
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiClosed);
    expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiClosed')]);
  });

  it('offers only End talk and no navigation on an unavailable NPC root', () => {
    enterKeeper();
    state().world.actions.changeTime(12 * 60);
    read();
    const before = interaction();
    const money = state().inventory.containers.protagonist.money;
    const options = resolveInteractionOptions(state());
    expect(
      Object.values(options.actions)
        .flat()
        .map((action) => action.actionId),
    ).toEqual(['system:endUnavailableConversation']);
    expect(options.navigation).toEqual({ canReturnToPoi: false, poiTransitions: [] });
    expect(resolveInteractionPresentation(state()).isRoot).toBe(false);
    state().interactionSlice.actions.endNpcConversation();
    state().world.actions.travelToPoi('fixtureOpenSite');
    expect(interaction()).toBe(before);
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(state().inventory.containers.protagonist.money).toBe(money);
    state().world.actions.changeTime(1);
    expect(interaction()?.currentEntry).toBeNull();
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.npcLeft);
  });

  it('does not treat an entry ban as closing an ongoing visit', () => {
    act({
      label: 'Ban entry',
      result: {
        effects: [{ type: 'setPoiEntryDisabled', poiId: '$currentPoi', isDisabled: true }],
      },
    });
    state().world.actions.changeTime(12 * 60);
    expect(interaction()?.activeFrameId).toBe('fixtureHub');
  });

  it('checks closure before entry events when travel arrives after closing time', () => {
    state().world.actions.travelToPoi('fixtureOpenSite');
    read();
    INITIAL_INTERCEPTORS[entryId] = { result: { effects: [{ type: 'addMoney', amount: 77 }] } };
    POI_TEMPLATES.fixtureHub = { ...hubTemplate, interceptorIds: [entryId] };
    closeAfter(12 * 60);
    act({
      label: 'Return later',
      result: { transition: { type: 'poi', poiId: 'fixtureHub', time: 12 * 60 } },
    });
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiClosed);
    expect(interaction()?.currentEntry?.blocks).toEqual([t('interactionUi.poiClosed')]);
    expect(state().inventory.containers.protagonist.money).toBe(100);
  });

  it('restricts a marked internal scene to leaving and keeps it occupied through day cleanup', () => {
    state().interactionSlice.actions.performAction('fixture:openInnerFrame');
    read();
    state().poiSlice.actions.markPoiForRemoval('fixtureHub');
    state().world.actions.changeTime(5);
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    state().world.actions.changeTime(24 * 60);
    expect(state().poiSlice.pois.fixtureHub).toBeDefined();
    expect(state().party.currentPartyPosition).toBe('fixtureHub');
    expect(interaction()?.activeFrameId).toBe(CONTEXT_EXIT_FRAMES.poiPendingRemoval);
    expect(state().ui.currentScreen).toBe('poiView');
  });
});
