import { useCombatState } from '@/state/useCombatState';

import { CombatCard } from '../CombatCard/CombatCard';

import './PlayerArea.scss';

export const PlayerArea = () => {
  const allyIds = useCombatState((state) => state.allyIds);

  return (
    <section className="playerArea">
      <div className="areaLabel">Allies</div>
      <div className="unit-container">
        {allyIds.map((id) => {
          return <CombatCard key={id} unitId={id} />;
        })}
      </div>
    </section>
  );
};
