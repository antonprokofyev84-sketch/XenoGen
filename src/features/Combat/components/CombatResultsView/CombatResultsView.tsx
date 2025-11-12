import { useShallow } from 'zustand/react/shallow';

import { useCombatState } from '@/state/useCombatState';
import { combatSelectors } from '@/state/useCombatState';
import { useGameState } from '@/state/useGameState';

import { CapturedSection } from '../CapturedSection/CapturedSection';
import { LootSection } from '../LootSection/LootSection';

import './CombatResultsView.scss';

export const CombatResultView = () => {
  const { combatStatus, characterMetrics } = useCombatState((state) => state.combatResult);
  console.log(characterMetrics);
  const selectedCellId = useGameState((state) => state.map.selectedCellId);
  const selectedPoiId = useGameState((state) => state.map.selectedPoiId);
  const clearSelectedPoiId = useGameState((state) => state.map.actions.clearSelectedPoiId);
  const removePoiFromCell = useGameState((state) => state.pois.actions.removePoiFromCell);
  const changePoiDetails = useGameState((state) => state.pois.actions.changePoiDetails);
  const aliveEnemies = useCombatState(
    useShallow((state) => combatSelectors.selectAliveEnemies(state)),
  );

  const goToScreen = useGameState((state) => state.ui.goToScreen);

  const handleBackToMap = () => {
    if (combatStatus === 'victory') {
      clearSelectedPoiId();
      removePoiFromCell(selectedCellId!, selectedPoiId!);
    }

    if (combatStatus === 'defeat' || combatStatus === 'retreat') {
      clearSelectedPoiId();
      changePoiDetails(selectedCellId!, selectedPoiId!, { enemyGroup: aliveEnemies });
    }

    goToScreen('strategicMap');
  };

  return (
    <div className="combatResultView">
      <div className="resultsContainer">
        <div className="metricsBlock">
          <h1 className={combatStatus}>{combatStatus === 'victory' ? 'Victory' : 'Defeat'}</h1>
          <h2>Combat Metrics</h2>
          {Object.entries(characterMetrics).map(([charId, metrics]) => (
            <div key={charId} className="metricCard">
              <h3>{charId}</h3>
              <div className="metric-grid">
                <span>Kills:</span>
                <strong>{metrics.kills}</strong>
                <span>Dmg Dealt:</span>
                <strong>{metrics.melee.totalDamageDealt + metrics.range.totalDamageDealt}</strong>
                <span>Dmg Taken:</span>
                <strong>{metrics.damageTaken}</strong>
                <span>Attacks:</span>
                <strong>{metrics.melee.attacksMade + metrics.range.attacksMade}</strong>
                <span>Hits:</span>
                <strong>{metrics.melee.hits + metrics.range.hits}</strong>
                <span>Misses:</span>
                <strong>{metrics.melee.misses + metrics.range.misses}</strong>
              </div>
            </div>
          ))}
          <button className="btn btn-solid btn-blue" onClick={handleBackToMap}>
            Back to Map
          </button>
        </div>

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
