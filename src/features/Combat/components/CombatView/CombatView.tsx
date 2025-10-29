import { CombatSidebar } from '../CombatSidebar/CombatSidebar';
import { EnemyArea } from '../EnemyArea/EnemyArea';
import { InitiativeBar } from '../InitiativeBar/InitiativeBar';
import { PlayerArea } from '../PlayerArea/PlayerArea';

import './CombatView.scss';

export const CombatView = () => {
  return (
    <div className="combatScreen" data-tid="combat-screen">
      <CombatSidebar />

      <main className="combatArenas">
        <EnemyArea />
        <PlayerArea />
      </main>

      <InitiativeBar />
    </div>
  );
};
