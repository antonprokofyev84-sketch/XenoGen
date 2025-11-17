import { BattleSummary } from '../BattleSummary/BattleSummary';
import { CapturedSection } from '../CapturedSection/CapturedSection';
import { LootSection } from '../LootSection/LootSection';

import './CombatResultsView.scss';

export const CombatResultView = () => {
  return (
    <div className="combatResultView">
      <div className="resultsContainer">
        <BattleSummary />

        <div className="lootBlock">
          <div>
            <h2>Loot Acquired</h2>
            <LootSection />
          </div>
          <CapturedSection />
        </div>
      </div>
    </div>
  );
};
