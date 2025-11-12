import type { CombatStatus } from '@/types/combat.types';
import type { ActiveTrait, TraitId, TriggerRule } from '@/types/traits.types';

import { traitsRegistry } from './traitsRegistry';

function triggersByStatus(status: CombatStatus, lvl?: { triggers?: any }): TriggerRule[] {
  if (!lvl?.triggers) return [];
  switch (status) {
    case 'victory':
      return lvl.triggers.onBattleWin ?? [];
    case 'defeat':
      return lvl.triggers.onBattleLose ?? [];
    case 'retreat':
      return lvl.triggers.onBattleFlee ?? [];
    default:
      return [];
  }
}

export const traitsManager = {
  // можно ли добавить трейт (проверка лимита категории на уровне шаблона)
  canAddTrait: (newTraitId: TraitId, currentTraits: ActiveTrait[]): boolean => {
    const newTpl = traitsRegistry.getById(newTraitId);
    if (!newTpl) return false;

    if (newTpl.category && newTpl.maxCategoryCount) {
      const currentCount = currentTraits.reduce((count, inst) => {
        const tpl = traitsRegistry.getById(inst.id);
        return tpl?.category === newTpl.category ? count + 1 : count;
      }, 0);
      if (currentCount >= newTpl.maxCategoryCount) return false;
    }

    return true;
  },

  // тик дня: уменьшаем duration, удаляем истёкшие, собираем onDayPass с текущего уровня
  computeOnDayPassForCharacter: (
    currentTraits: ActiveTrait[],
  ): { updatedTraits: ActiveTrait[]; effects: TriggerRule[] } => {
    const updatedTraits: ActiveTrait[] = [];
    const effects: TriggerRule[] = [];

    for (const inst of currentTraits) {
      const next: ActiveTrait =
        typeof inst.duration === 'number' ? { ...inst, duration: inst.duration - 1 } : inst;

      // если duration закончилась — не возвращаем
      if (!(next.duration === undefined || next.duration > 0)) continue;

      updatedTraits.push(next);

      const lvl = traitsRegistry.resolveLevel(next.id, next.level);
      const onDayPass = lvl?.triggers?.onDayPass;
      if (onDayPass?.length) effects.push(...onDayPass);
    }

    return { updatedTraits, effects };
  },

  // конец боя: собираем триггеры уровня по статусу боя
  computeOnBattleEndForCharacter: (
    currentTraits: ActiveTrait[],
    combatStatus: CombatStatus,
  ): { effects: TriggerRule[] } => {
    const effects: TriggerRule[] = [];

    for (const inst of currentTraits) {
      const lvl = traitsRegistry.resolveLevel(inst.id, inst.level);
      if (!lvl) continue;
      const list = triggersByStatus(combatStatus, { triggers: lvl.triggers });
      if (list.length) effects.push(...list);
    }

    return { effects };
  },
};
