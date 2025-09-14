import { useState } from 'react';
import { useGameStore } from '@/state/useGameState';
import { useShallow } from 'zustand/react/shallow';
import './CharacterCreation.scss';
import type { MainStatKey, SkillKey } from '@/state/slices/player';
import textData from '@/locales/en.json';
import { MainStatsBlock } from './components/MainStatsBlock/MainStatsBlock';
import { SecondaryStatsBlock } from './components/SecondaryStatsBlock/SecondaryStatsBlock';
import { SkillsBlock } from './components/SkillsBlock/SkillsBlock';

const INITIAL_CREATION_POINTS = 150;
const MIN_STAT = 30;
const MAX_STAT = 70;
const MIN_SKILL = 0;
const MAX_SKILL = 50;

export const CharacterCreation = () => {
  const [creationPoints, setCreationPoints] = useState(INITIAL_CREATION_POINTS);
  const [pointStep, setPointStep] = useState(5);

  const { changeMainStat, changeSkill, resetMainStats, goToScreen } = useGameStore(
    useShallow((state) => ({
      changeMainStat: state.player.actions.changeMainStat,
      changeSkill: state.player.actions.changeSkill,
      resetMainStats: state.player.actions.resetMainStats,
      goToScreen: state.ui.goToScreen,
    })),
  );

  const handleStatChange = (statKey: MainStatKey, delta: number) => {
    changeMainStat(statKey, delta);
    setCreationPoints((currentPoints) => currentPoints - delta);
  };

  const handleSkillChange = (skillKey: SkillKey, delta: number) => {
    changeSkill(skillKey, delta);
    setCreationPoints((currentPoints) => currentPoints - delta);
  };

  const handleBackButtonClick = () => {
    resetMainStats();
    setCreationPoints(INITIAL_CREATION_POINTS);
    goToScreen('mainMenu');
  };

  const handleStartGameClick = () => {
    console.log('Start Game button clicked!');
  };

  return (
    <div className="characterCreationContainer">
      <div className="statsContainer">
        <div className="header">
          <div className="freePoints">
            <h2>{textData.characterCreation.freePoints}: </h2>
            <span className="pointsValue">{creationPoints}</span>
          </div>

          <h1>{textData.characterCreation.title}</h1>

          <div className="pointStepSelector">
            <h2>Step:</h2>
            <button
              className={`stepButton ${pointStep === 1 ? 'active' : ''}`}
              onClick={() => setPointStep(1)}
            >
              x1
            </button>
            <button
              className={`stepButton ${pointStep === 5 ? 'active' : ''}`}
              onClick={() => setPointStep(5)}
            >
              x5
            </button>

            <button
              className={`stepButton ${pointStep === 10 ? 'active' : ''}`}
              onClick={() => setPointStep(10)}
            >
              x10
            </button>
          </div>
        </div>

        <div className="statsSections">
          <MainStatsBlock
            freePoints={creationPoints}
            onStatChange={handleStatChange}
            pointStep={pointStep}
            minStat={MIN_STAT}
            maxStat={MAX_STAT}
          />
          <SecondaryStatsBlock />
          <SkillsBlock
            freePoints={creationPoints}
            onSkillChange={handleSkillChange}
            pointStep={pointStep}
            minSkill={MIN_SKILL}
            maxSkill={MAX_SKILL}
          />
        </div>
      </div>

      <div className="footerButtons">
        <button className="backButton" onClick={handleBackButtonClick}>
          {textData.characterCreation.backButton}
        </button>
        <button className="startButton" onClick={handleStartGameClick}>
          {textData.characterCreation.startButton}
        </button>
      </div>
    </div>
  );
};
