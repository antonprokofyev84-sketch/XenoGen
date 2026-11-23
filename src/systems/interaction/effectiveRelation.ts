import { getLoyaltyProfile } from '@/data/factionsLoyalty.rules';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import type { StoreState } from '@/state/useGameState';
import type { FactionId } from '@/types/ids.types';

/**
 * Эффективное отношение NPC к игроку.
 *
 * Складывает личное отношение и репутацию фракции по её loyalty-профилю.
 * Фракция у NPC обязательна, поэтому профиль разрешим всегда и fallback не
 * требуется; у `independents` вклад фракции нулевой.
 */
export function resolveEffectiveRelation(params: {
  factionId: FactionId;
  factionReputation: number;
  personalAffection: number;
}): number {
  const { personalWeight, factionWeight } = getLoyaltyProfile(params.factionId);

  return params.personalAffection * personalWeight + params.factionReputation * factionWeight;
}

/**
 * То же самое для NPC текущего interaction. В POI-контексте NPC отсутствует.
 */
export function resolveCurrentNpcEffectiveRelation(state: StoreState): number | undefined {
  const npcId = state.interactionSlice.currentInteraction?.npcId;
  if (npcId === undefined) return undefined;
  const npc = state.npcSlice.byId[npcId];
  const factionId = INITIAL_NPCS[npcId].faction;

  return resolveEffectiveRelation({
    factionId,
    factionReputation: state.factions.reputationById[factionId] ?? 0,
    personalAffection: npc.affection,
  });
}
