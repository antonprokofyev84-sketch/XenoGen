import { useEffect, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useCombatState } from '@/state/useCombatState';

import './DamageFloatStagger.scss';

type DamageFloatStaggerProps = {
  unitId: string;
  delayBetweenMs?: number;
  lifeMs?: number;
};

export const DamageFloatStagger = ({
  unitId,
  delayBetweenMs = 600,
  lifeMs = 1000,
}: DamageFloatStaggerProps) => {
  const currentAttackResults = useCombatState(
    useShallow((state) => state.attackResultById[unitId]),
  );
  const [localAttackResult, setLocalAttackResult] = useState(currentAttackResults || []);

  const handleAnimationEnd = () => {
    setLocalAttackResult([]);
  };

  useEffect(() => {
    if (currentAttackResults && currentAttackResults !== localAttackResult) {
      setLocalAttackResult(currentAttackResults);
    }
  }, [currentAttackResults]);

  return (
    <div className="damageFloatStagger">
      {localAttackResult.map((item, index) => {
        const isMiss = item.type === 'miss';
        const isCrit = item.type === 'crit';
        const label = isMiss ? 'MISS' : item.damage;

        // небольшой разброс по X, чтобы не слипались
        const offsetXPercent = ((index * 7) % 16) - 8; // детерминированно, без Math.random

        return (
          <div
            key={index}
            className={`damageFloat ${isMiss ? 'miss' : isCrit ? 'crit' : 'hit'}`}
            style={{
              animationDelay: `${index * delayBetweenMs}ms`,
              animationDuration: `${lifeMs}ms`,
              left: `calc(50% + ${offsetXPercent}%)`,
            }}
            data-tid="damage-float"
            onAnimationEnd={index === localAttackResult.length - 1 ? handleAnimationEnd : undefined}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
