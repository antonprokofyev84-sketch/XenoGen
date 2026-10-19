import { INITIAL_FRAMES } from '@/data/initial/frames';
import type { StoreState } from '@/state/useGameState';
import { resolveNpcImage } from '@/systems/npc/npcImageResolver';
import type { NpcDisplayMode } from '@/types/frame.types';
import { DEFAULT_NPC_DISPLAY_MODE } from '@/types/frame.types';
import type { CharacterId, NpcId } from '@/types/ids.types';
import { isDialogueLine } from '@/types/narrativeBlock.types';

import { resolveNpcDisplayName } from './narrativeSnapshots';

/**
 * Производные данные подачи экрана.
 *
 * Отдельным снимком они не сохраняются: фон, визуальный вариант, роль и
 * отображаемое имя вычисляются из текущего состояния, а в логе лежит только
 * уже разрешённый narrative.
 */

export interface NpcOverlay {
  npcId: NpcId;
  name: string;
  imageUrl?: string;
  /** Говорит ли этот NPC последнюю реплику лога. */
  isSpeaking: boolean;
}

export interface InteractionPresentation {
  /** Фон текущего Frame либо унаследованный от предыдущего. */
  background?: string;
  npcDisplay: NpcDisplayMode;
  /** NPC текущего slot-контекста; показывается справа. */
  contextNpc?: NpcOverlay;
  /** Говорящий, отличный от контекстного NPC; показывается слева. */
  speakerNpc?: NpcOverlay;
}

const EMPTY_PRESENTATION: InteractionPresentation = { npcDisplay: 'none' };

/** Последняя прямая речь лога; именно её произносит подсвеченный NPC. */
function resolveLastSpeakerId(state: StoreState): CharacterId | undefined {
  const log = state.interactionSlice.currentInteraction?.log ?? [];

  for (let entryIndex = log.length - 1; entryIndex >= 0; entryIndex--) {
    const blocks = log[entryIndex].blocks;

    for (let blockIndex = blocks.length - 1; blockIndex >= 0; blockIndex--) {
      const block = blocks[blockIndex];
      if (isDialogueLine(block)) return block.speakerId;
    }
  }

  return undefined;
}

export function resolveInteractionPresentation(state: StoreState): InteractionPresentation {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return EMPTY_PRESENTATION;

  const npcDisplay =
    INITIAL_FRAMES[interaction.activeFrameId]?.npcDisplay ?? DEFAULT_NPC_DISPLAY_MODE;

  const presentation: InteractionPresentation = {
    npcDisplay,
    ...(interaction.currentBackground !== undefined
      ? { background: interaction.currentBackground }
      : {}),
  };

  if (npcDisplay === 'none') return presentation;

  const speakerId = resolveLastSpeakerId(state);
  const contextNpcId = interaction.npcId;

  const buildOverlay = (npcId: NpcId): NpcOverlay => {
    const imageUrl = resolveNpcImage(npcId);

    return {
      npcId,
      name: resolveNpcDisplayName(state, npcId),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      isSpeaking: speakerId === npcId,
    };
  };

  // `always` держит контекстного NPC на экране независимо от того, кто говорит.
  if (contextNpcId !== undefined && npcDisplay === 'always') {
    presentation.contextNpc = buildOverlay(contextNpcId);
  }

  if (speakerId !== undefined && speakerId !== contextNpcId && speakerId in state.npcSlice.byId) {
    presentation.speakerNpc = buildOverlay(speakerId);
  }

  // В режиме `speaker` контекстный NPC виден, только пока говорит сам.
  if (contextNpcId !== undefined && npcDisplay === 'speaker' && speakerId === contextNpcId) {
    presentation.contextNpc = buildOverlay(contextNpcId);
  }

  return presentation;
}
