import { useCombatStore } from '@/state/useCombatStore';

import { CombatCard } from '../CombatCard/CombatCard';

import './EnemyArea.scss';

export const EnemyArea = () => {
  const enemyIds = useCombatStore((state) => state.enemyIds);

  return (
    <section className="enemyArea">
      <div className="areaLabel">Enemies</div>
      <div className="unit-container">
        {enemyIds.map((id) => {
          return <CombatCard key={id} unitId={id} />;
        })}
      </div>
    </section>
  );
};
