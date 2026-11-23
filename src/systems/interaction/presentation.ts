import { INITIAL_FRAMES } from '@/data/initial/frames';
import type { StoreState } from '@/state/useGameState';
import { resolveNpcImage } from '@/systems/npc/npcImageResolver';
import { resolveText } from '@/systems/text/resolveText';
import { resolvePoiDisplayName } from '@/systems/world/locationPresentation';
import { DEFAULT_NPC_DISPLAY_MODE } from '@/types/frame.types';
import type { NpcId, SlotId } from '@/types/ids.types';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import { isDialogueLine } from '@/types/narrativeBlock.types';
import type { NonCellPoiNode } from '@/types/worldNode.types';

import { findCurrentSlotDefinition, listCurrentSlotDefinitions } from './actionSources';
import { resolveCurrentRootFrameId } from './frameIds';
import { resolveNpcDisplayName } from './narrativeSnapshots';

export interface UiNpcSlot {
  slotId: SlotId;
  npcId: NpcId;
  role: string;
  name: string;
}

export interface NpcOverlay {
  npcId: NpcId;
  name: string;
  imageUrl?: string;
}
export interface InteractionPresentation {
  reading: { mode: 'actions' } | { mode: 'narrative'; blocks: NarrativeBlock[] };
  background?: string;
  title: string;
  locationTitle: string;
  name?: string;
  role?: string;
  figure?: NpcOverlay;
  showPortraits: boolean;
  portraits: UiNpcSlot[];
  isRoot: boolean;
}
const EMPTY: InteractionPresentation = {
  reading: { mode: 'actions' },
  title: '',
  locationTitle: '',
  showPortraits: false,
  portraits: [],
  isRoot: false,
};

/** Портреты читают текущую occupancy и сохраняются во внутренних Frames. */
function resolveCurrentPoiNpcSlots(state: StoreState): UiNpcSlot[] {
  // Портреты принадлежат POI текущего interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  const occupants = state.occupancySlice.slotOccupants[interaction.poiId] ?? {};
  return listCurrentSlotDefinitions(state).flatMap((slot) => {
    const npcId = occupants[slot.id];
    return npcId === undefined
      ? []
      : [{ slotId: slot.id, npcId, role: slot.role, name: resolveNpcDisplayName(state, npcId) }];
  });
}

/** Одна фигура слева; speaker выбирается только из текущей порции текста. */
export function resolveInteractionPresentation(state: StoreState): InteractionPresentation {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return EMPTY;
  const poi = state.poiSlice.pois[interaction.poiId] as NonCellPoiNode;
  const frame = INITIAL_FRAMES[interaction.activeFrameId];
  const locationTitle = resolvePoiDisplayName(poi.templateId);
  const isRoot = interaction.activeFrameId === resolveCurrentRootFrameId(state);
  const mode = frame.npcDisplay ?? DEFAULT_NPC_DISPLAY_MODE;
  if (mode === 'always' && interaction.npcId === undefined) {
    throw new Error('npcDisplay: always requires an NPC context: ' + interaction.activeFrameId);
  }
  const blocks = interaction.currentEntry?.blocks ?? [];
  const speaker = [...blocks]
    .reverse()
    .find((block) => isDialogueLine(block) && block.speakerId in state.npcSlice.byId);
  const speakerId = speaker && isDialogueLine(speaker) ? speaker.speakerId : undefined;
  let figureId: NpcId | undefined;
  switch (mode) {
    case 'none':
      break;
    case 'always':
      figureId = speakerId ?? interaction.npcId;
      break;
    case 'speaker':
      figureId = speakerId;
      break;
  }
  const npcId = figureId ?? interaction.npcId;
  return {
    reading: blocks.length ? { mode: 'narrative', blocks } : { mode: 'actions' },
    background: interaction.currentBackground,
    locationTitle,
    title: isRoot ? locationTitle : resolveText(frame.title ?? locationTitle),
    name: npcId === undefined ? undefined : resolveNpcDisplayName(state, npcId),
    role: interaction.slotId === undefined ? undefined : findCurrentSlotDefinition(state).role,
    figure:
      figureId === undefined
        ? undefined
        : {
            npcId: figureId,
            name: resolveNpcDisplayName(state, figureId),
            imageUrl: resolveNpcImage(figureId),
          },
    showPortraits: true,
    portraits: resolveCurrentPoiNpcSlots(state),
    isRoot,
  };
}
