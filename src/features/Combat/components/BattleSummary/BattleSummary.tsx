import { useShallow } from 'zustand/react/shallow';

import { combatSelectors, useCombatState } from '@/state/useCombatState';
import { useGameState } from '@/state/useGameState';
import type { EffectLog } from '@/types/logs.types';

import './BattleSummary.scss';

const getFlavorText = (status: string) => {
  switch (status) {
    case 'victory':
      return 'Threat eliminated. The survivors gather their spoils.';
    case 'defeat':
      return 'The squad is broken. You were defeated, but the story is not over.';
    case 'retreat': // 'fled'
      return 'You retreated to fight another day. Sometimes, survival is the only victory.';
    default:
      return 'The battle is over.';
  }
};

const formatDelta = (delta: number): string => {
  return delta > 0 ? `+${delta}` : `${delta}`;
};

// 2. Универсальный вординг для логов
const formatLogMessage = (log: EffectLog): string => {
  switch (log.type) {
    // --- Статы / Скиллы (Остаются как есть) ---
    case 'modifyMainStat':
      return `${log.stat.toUpperCase()} ${formatDelta(log.delta)} (Total: ${log.newValue})`;
    case 'modifySkill':
      return `${log.skill} skill ${formatDelta(log.delta)} (Total: ${Math.floor(log.newValue)})`;
    case 'setMainStat':
      return `${log.stat.toUpperCase()} set to ${log.newValue}`;
    case 'setSkill':
      return `${log.skill} skill set to ${Math.floor(log.newValue)}`;

    // --- Трейты (УНИВЕРСАЛЬНЫЙ ВОРДИНГ) ---
    case 'addTrait':
      return `Trait Gained: ${log.traitId} (Lvl ${log.level})`;
    case 'removeTrait':
      return `Trait Lost: ${log.traitId}`;
    case 'replaceTrait':
      return `Trait Replaced: ${log.fromId} -> ${log.toId}`;
    case 'levelUpTrait':
      return `Trait Leveled Up: ${log.traitId} (New Lvl: ${log.newLevel})`;
    case 'levelDownTrait':
      return `Trait Leveled Down: ${log.traitId} (New Lvl: ${log.newLevel})`;
    case 'setTraitLevel':
      return `Trait ${log.traitId} level set to ${log.newLevel}`;

    // --- Прогресс / Длительность (Остаются как есть) ---
    case 'modifyProgress':
      return `${log.traitId} progress ${formatDelta(log.delta)} (New: ${log.newValue})`;
    case 'setProgress':
      return `${log.traitId} progress set to ${log.newValue}`;
    case 'setDuration':
      return `${log.traitId} duration set to ${log.newValue}`;

    default:
      // @ts-expect-error - Защита, если мы забыли тип
      return `${log.type}`;
  }
};
// --- КОНЕЦ НОВОЙ ЛОГИКИ ---

export const BattleSummary = () => {
  // --- Данные из Сторов ---
  const combatStatus = useCombatState((state) => state.combatResult.combatStatus);
  const characterUpdates = useCombatState((state) => state.characterUpdates);

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
    <div className="metricsBlock">
      {/* 1. Заголовок и Художественный текст */}
      <h1 className={combatStatus}>{combatStatus}</h1>
      <p className="flavorText">{getFlavorText(combatStatus)}</p>

      {/* 2. Новый Хедер (Последствия) */}
      <h2>Battle Aftermath</h2>
      <div className="aftermathLog">
        {Object.entries(characterUpdates || {}).map(([charId, logs]) => (
          <div key={charId} className="metricCard">
            <h3>{charId}</h3>
            {logs.length > 0 ? (
              <ul className="logList">
                {logs.map((log, index) => (
                  <li key={index} className={`logItem ${log.type}`}>
                    {formatLogMessage(log)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="noChangesText">No changes.</p>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-solid btn-blue" onClick={handleBackToMap}>
        Back to Map
      </button>
    </div>
  );
};
