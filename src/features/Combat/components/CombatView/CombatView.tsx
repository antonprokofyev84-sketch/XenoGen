import { Button } from '@/components/Button/Button';
import { useCombatStore } from '@/state/useCombatStore';

import { InitiativeBar } from '../InitiativeBar/InitiativeBar';

import './CombatView.scss';

export const CombatView = () => {
  const unitsByInstanceId = useCombatStore((state) => state.unitsById);
  const partyUnitIds = useCombatStore((state) => state.allyIds);
  const enemyUnitIds = useCombatStore((state) => state.enemyIds);
  const endTurn = useCombatStore((state) => state.actions.endTurn);

  const handleEndTurn = () => {
    endTurn();
  };

  return (
    <div className="combatScreen" data-tid="combat-screen">
      <aside className="controlsSidebar">
        <h3>Actions</h3>
        <div className="actions-grid">
          <Button
            variant="outline"
            color="green"
            onClick={() => {
              handleEndTurn();
            }}
          >
            Ability 1
          </Button>
          <Button variant="outline" color="green">
            Ability 2
          </Button>
          <Button variant="outline" color="blue">
            Ability 3
          </Button>
          <Button variant="outline" color="blue">
            Ability 4
          </Button>
          <Button variant="solid" color="yellow" disabled>
            Item
          </Button>
          <Button variant="solid" color="white">
            Defend
          </Button>
        </div>
        <div className="end-turn-container">
          <Button variant="ghost" color="red">
            End Turn
          </Button>
        </div>
      </aside>

      <main className="combatArenas">
        <section className="enemyArea">
          <div className="areaLabel">Enemies</div>
          {enemyUnitIds.map((instanceId) => {
            const unit = unitsByInstanceId[instanceId];
            return (
              <div key={instanceId} data-tid="enemy-card">
                {unit.templateId} (lvl {unit.level})
              </div>
            );
          })}
        </section>

        <section className="playerArea">
          <div className="areaLabel">Allies</div>
          {partyUnitIds.map((instanceId) => {
            const unit = unitsByInstanceId[instanceId];
            return (
              <div key={instanceId} data-tid="ally-card">
                {unit.templateId} (lvl {unit.level})
              </div>
            );
          })}
        </section>
      </main>

      <InitiativeBar />
    </div>
  );
};
