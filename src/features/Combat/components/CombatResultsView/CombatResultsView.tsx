import { useShallow } from 'zustand/react/shallow';

import { useCombatState } from '@/state/useCombatState';
import { combatSelectors } from '@/state/useCombatState';
import { useGameStore } from '@/state/useGameState';

import './CombatResultsView.scss';

export const CombatResultView = () => {
  const { combatStatus, characterMetrics, loot, capturedEnemies } = useCombatState(
    (state) => state.combatResult,
  );
  const selectedCellId = useGameStore((state) => state.map.selectedCellId);
  const selectedPoiId = useGameStore((state) => state.map.selectedPoiId);
  const clearSelectedPoiId = useGameStore((state) => state.map.actions.clearSelectedPoiId);
  const removePoiFromCell = useGameStore((state) => state.pois.actions.removePoiFromCell);
  const changePoiDetails = useGameStore((state) => state.pois.actions.changePoiDetails);
  const aliveEnemies = useCombatState(
    useShallow((state) => combatSelectors.selectAliveEnemies(state)),
  );

  const goToScreen = useGameStore((state) => state.ui.goToScreen);

  const handleBackToMap = () => {
    if (combatStatus === 'victory') {
      clearSelectedPoiId();
      removePoiFromCell(selectedCellId!, selectedPoiId!);
    }

    if (combatStatus === 'defeat' || combatStatus === 'fled') {
      clearSelectedPoiId();
      changePoiDetails(selectedCellId!, selectedPoiId!, { enemyGroup: aliveEnemies });
    }

    goToScreen('strategicMap');
  };

  const hasEnemies = capturedEnemies && capturedEnemies.length > 0;

  return (
    <div className="combatResultView">
      <h1 className={combatStatus}>{combatStatus === 'victory' ? 'Victory' : 'Defeat'}</h1>

      <div className="resultsContainer">
        <div className="metricsBlock">
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
        </div>

        <div className="rewardsBlock">
          <div className={`lootBlock ${!hasEnemies ? 'fullHeight' : ''}`}>
            <h2>Loot</h2>
            <ul>
              {loot.map((item, index) => (
                <li key={index}>
                  {item.id} (x{item.quantity})
                </li>
              ))}
              {loot.length === 0 && <li>No loot found.</li>}
            </ul>
          </div>

          {hasEnemies && (
            <div className="capturedBlock">
              <h2>Captured</h2>
              <ul>
                {capturedEnemies.map((enemy, index) => (
                  <li key={index}>{enemy.templateId}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <button className="btn btn-solid btn-blue" onClick={handleBackToMap}>
        Back to Map
      </button>
    </div>
  );
};
