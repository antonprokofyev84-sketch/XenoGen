import { useGameStore, characterSelectors } from '@/state/useGameState';
import { useShallow } from 'zustand/react/shallow';
import textData from '@/locales/en.json';
import './SecondaryStatsBlock.scss';

export const SecondaryStatsBlock = () => {
  console.log('SecondaryStatsBlock render');
  const protagonistId = useGameStore(useShallow((state) => state.characters.protagonistId));
  const stats = useGameStore(useShallow(characterSelectors.selectSecondaryStats(protagonistId)));

  return (
    <div className="secondaryStatsBlock">
      <h2>{textData.characterCreation.secondaryStatsTitle}</h2>

      <div className="statRow">
        <span className="statName">{textData.secondaryStats.maxHp}</span>
        <span className="statValue">{stats.maxHp}</span>
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
        <span className="statName">{textData.secondaryStats.damageModifier}</span>
        <span className="statValue">{stats.damageModifier}</span>
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
