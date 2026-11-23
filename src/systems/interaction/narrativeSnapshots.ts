import { INITIAL_NPCS } from '@/data/initial/npcs';
import type { StoreState } from '@/state/useGameState';
import { resolveText } from '@/systems/text/resolveText';
import type { NpcId } from '@/types/ids.types';
import type { CurrentInteraction } from '@/types/interactionRuntime.types';
import type { DialogueLine, NarrativeBlock, ThoughtLine } from '@/types/narrativeBlock.types';
import {
  CURRENT_NPC_NAME_PLACEHOLDER,
  CURRENT_NPC_SPEAKER,
  isDialogueLine,
  isThoughtLine,
} from '@/types/narrativeBlock.types';

import { findSlotDefinition } from './actionSources';

/**
 * Разрешение narrative в снимок лога.
 *
 * `$npc` и `${npc}` подставляются **один раз**, в момент записи: последующая
 * смена occupancy, роли или знакомства уже показанный текст не меняет.
 */

/**
 * Отображаемое имя NPC.
 *
 * Знакомый NPC представлен именем, незнакомый — ролью своего slot.
 *
 * Роль берётся из occupancy, а не из текущего interaction-контекста: имя
 * может понадобиться и для постороннего говорящего, а его роль — та, которую
 * он занимает сам, а не роль собеседника. Неразмещённый NPC роли не имеет
 * и показывается именем.
 */
export function resolveNpcDisplayName(state: StoreState, npcId: NpcId): string {
  const authoredName = INITIAL_NPCS[npcId].name;
  const isKnown = state.npcSlice.byId[npcId].timesMet > 0;

  if (isKnown) return authoredName;

  const placement = state.occupancySlice.npcPlacements[npcId];
  if (!placement) return authoredName;

  // Occupancy создаёт placement только для существующего slot его POI.
  return findSlotDefinition(state, placement.poiId, placement.slotId)!.role;
}

const substituteName = (text: string, displayName: string | undefined): string =>
  displayName === undefined ? text : text.split(CURRENT_NPC_NAME_PLACEHOLDER).join(displayName);

function resolveBlock(
  block: NarrativeBlock,
  interaction: CurrentInteraction,
  displayName: string | undefined,
): NarrativeBlock {
  if (isDialogueLine(block)) {
    const resolved: DialogueLine = {
      // Говорящий фиксируется конкретным ID: `$npc` в снимке не остаётся.
      speakerId:
        block.speakerId === CURRENT_NPC_SPEAKER && interaction.npcId !== undefined
          ? interaction.npcId
          : block.speakerId,
      text: substituteName(resolveText(block.text), displayName),
    };
    return resolved;
  }
  if (isThoughtLine(block)) {
    const resolved: ThoughtLine = {
      thought: substituteName(resolveText(block.thought), displayName),
    };
    return resolved;
  }
  return substituteName(resolveText(block), displayName);
}

export function resolveNarrativeSnapshot(
  state: StoreState,
  blocks: readonly NarrativeBlock[],
): NarrativeBlock[] {
  // Narrative поступает только в уже созданный текущий interaction.
  const interaction = state.interactionSlice.currentInteraction!;
  // `${npc}` адресуется именно NPC текущего контекста.
  const displayName =
    interaction.npcId === undefined ? undefined : resolveNpcDisplayName(state, interaction.npcId);

  return blocks.map((block) => resolveBlock(block, interaction, displayName));
}
