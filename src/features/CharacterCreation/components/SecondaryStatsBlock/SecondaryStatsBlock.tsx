import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { characterSelectors, useGameState } from '@/state/useGameState';

import './SecondaryStatsBlock.scss';

export const SecondaryStatsBlock = () => {
  console.log('SecondaryStatsBlock render');
  const protagonistId = useGameState((state) => state.characters.protagonistId);
  const stats = useGameState(useShallow(characterSelectors.selectSecondaryStats(protagonistId)));

  return (
    <div className="secondaryStatsBlock">
      <h2>{textData.characterCreation.secondaryStatsTitle}</h2>

      <div className="statRow">
        <span className="statName">{textData.secondaryStats.maxHp}</span>
        <span className="statValue">{stats.maxHp}</span>
      </div>

      <div className="statRow">
        <span className="statName">{textData.secondaryStats.maxStamina}</span>
        <span className="statValue">{stats.maxStamina}</span>
      </div>

      <div className="statRow">
        <span className="statName">{textData.secondaryStats.armor}</span>
        <span className="statValue">{stats.armor}</span>
      </div>
      <div className="statRow">
        <span className="statName">{textData.secondaryStats.evasion}</span>
        <span className="statValue">{stats.evasion}</span>
      </div>
      <div className="statRow">
        <span className="statName">{textData.secondaryStats.meleeAttackPower}</span>
        <span className="statValue">{stats.meleeAttackPower}</span>
      </div>
      <div className="statRow">
        <span className="statName">{textData.secondaryStats.critChance}</span>
        <span className="statValue">{stats.critChance}%</span>
      </div>

      <div className="statRow">
        <span className="statName">{textData.secondaryStats.initiative}</span>
        <span className="statValue">{stats.initiative}</span>
      </div>
    </div>
  );
};
