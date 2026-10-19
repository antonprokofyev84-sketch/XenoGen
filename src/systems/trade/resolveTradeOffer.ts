import { PROTAGONIST_ID } from '@/constants';
import { characterDraft } from '@/state/gameSlices/characters';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import { rollStatCheck } from '@/systems/rolls/statRollService';
import type { SkillKey } from '@/types/character.types';
import type { InteractionEffectDescriptor } from '@/types/interaction.types';
import { buildTradeOfferRule } from './tradeNegotiation';

/**
 * Разрешение торгового предложения.
 *
 * Торговля сохраняется как есть до утверждения её собственного scope, но
 * больше не проходит через удалённый сервисный исполнитель: бросок и
 * начисление опыта выполняются здесь напрямую.
 */
function applySkillEffects(
  state: StoreState,
  effects: readonly InteractionEffectDescriptor[] | undefined,
): void {
  for (const effect of effects ?? []) {
    if (effect.type !== 'modifySkill') continue;
    characterDraft.changeSkill(state, PROTAGONIST_ID, effect.skill as SkillKey, effect.delta);
  }
}

export function resolveTradeOffer(
  state: StoreState,
  params: { satisfaction: number; tradeValue: number; attempts: number },
  rng: Rng = defaultRng,
): boolean {
  const rule = buildTradeOfferRule(params.satisfaction, params.tradeValue, params.attempts);
  const { success } = rollStatCheck(
    state,
    { characterId: PROTAGONIST_ID, stat: 'trade', difficulty: rule.difficulty ?? 0 },
    rng,
  );
  applySkillEffects(state, success ? rule.onSuccess : rule.onFail);
  return success;
}
