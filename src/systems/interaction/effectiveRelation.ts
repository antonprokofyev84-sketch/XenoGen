import { getLoyaltyProfile } from '@/data/factionsLoyalty.rules';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import type { StoreState } from '@/state/useGameState';
import type { FactionId, NpcId } from '@/types/ids.types';

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
 * То же самое для конкретного NPC.
 *
 * `undefined` означает, что NPC нет в мире либо у него нет авторской записи:
 * это разные состояния и не сводятся к нулю на этом уровне.
 */
export function resolveNpcEffectiveRelation(state: StoreState, npcId: NpcId): number | undefined {
  const npc = state.npcSlice.byId[npcId];
  const factionId = INITIAL_NPCS[npcId]?.faction;

  if (!npc || factionId === undefined) return undefined;

  return resolveEffectiveRelation({
    factionId,
    factionReputation: state.factions.reputationById[factionId] ?? 0,
    personalAffection: npc.affection,
  });
}
