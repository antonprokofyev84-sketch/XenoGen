import { Button } from '@/components/Button/Button';
import { useCombatState } from '@/state/useCombatState';

import './CombatSidebar.scss';

export const CombatSidebar = () => {
  const endTurn = useCombatState((state) => state.actions.endTurn);

  const handleAbilityClick = (abilityIndex: number) => {
    console.log(`Ability ${abilityIndex + 1} clicked`);
  };

  const handleEndTurnClick = () => {
    console.log('End Turn clicked');
    endTurn();
  };

  return (
    <aside className="controlsSidebar">
      <h3>Actions</h3>
      <div className="actions-grid">
        <Button variant="outline" color="green" onClick={() => handleAbilityClick(0)}>
          Ability 1
        </Button>
        <Button variant="outline" color="green" onClick={() => handleAbilityClick(1)}>
          Ability 2
        </Button>
        <Button variant="outline" color="blue" onClick={() => handleAbilityClick(2)}>
          Ability 3
        </Button>
        <Button variant="outline" color="blue" onClick={() => handleAbilityClick(3)}>
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
        <Button variant="ghost" color="red" onClick={handleEndTurnClick}>
          End Turn
        </Button>
      </div>
    </aside>
  );
};
