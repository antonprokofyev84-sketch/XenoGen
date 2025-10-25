import { useCombatStore } from '@/state/useCombatStore';

import { CombatCard } from '../CombatCard/CombatCard';

import './PlayerArea.scss';

export const PlayerArea = () => {
  const allyIds = useCombatStore((state) => state.allyIds);

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
