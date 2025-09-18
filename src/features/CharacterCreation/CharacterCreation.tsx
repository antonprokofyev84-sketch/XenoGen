import { useState } from 'react';
import { useGameStore, playerSelectors } from '@/state/useGameState';
import './CharacterCreation.scss';
import type { MainStatKey, SkillKey } from '@/types/character.types';
import textData from '@/locales/en.json';
import { MainStatsBlock } from './components/MainStatsBlock/MainStatsBlock';
import { SecondaryStatsBlock } from './components/SecondaryStatsBlock/SecondaryStatsBlock';
import { SkillsBlock } from './components/SkillsBlock/SkillsBlock';
import { TraitBlock } from './components/TraitBlock/TraitBlock';

const INITIAL_CREATION_POINTS = 150;
const MIN_STAT = 15;
const MAX_STAT = 50;
const MIN_SKILL = 0;
const MAX_SKILL = 50;

const STEP_OPTIONS = [1, 5, 10] as const;

export const CharacterCreation = () => {
  const [creationPoints, setCreationPoints] = useState(INITIAL_CREATION_POINTS);
  const [pointStep, setPointStep] = useState<number>(5);

  const { changeMainStat, changeSkill, resetMainStats, resetSkills } = useGameStore(
    (state) => state.player.actions,
  );

  const { addTraitToCharacter: addTrait, removeTraitFromCharacter: removeTrait } = useGameStore(
    (state) => state.traits.actions,
  );

  const goToScreen = useGameStore((state) => state.ui.goToScreen);

  const heroId = useGameStore(playerSelectors.id);

  const handleStatChange = (statKey: MainStatKey, delta: number) => {
    changeMainStat(statKey, delta);
    setCreationPoints((p) => p - delta);
  };

  const handleSkillChange = (skillKey: SkillKey, delta: number) => {
    changeSkill(skillKey, delta);
    setCreationPoints((p) => p - delta);
  };

  const handleTraitAdd = (traitId: string, traitCost?: number) => {
    addTrait(heroId, traitId);
    setCreationPoints((p) => p - (traitCost ?? 0));
  };

  const handleTraitRemove = (traitId: string, traitCost?: number) => {
    removeTrait(heroId, traitId);
    setCreationPoints((p) => p + (traitCost ?? 0));
  };

  const handleBack = () => {
    resetMainStats();
    resetSkills();
    setCreationPoints(INITIAL_CREATION_POINTS);
    goToScreen('mainMenu');
  };

  const handleStart = () => {
    console.log('Start Game button clicked!');
  };

  return (
    <div className="characterCreation">
      <section className="characterCreationPanel">
        <header className="characterCreationHeader">
          <div className="characterCreationSummary">
            <h2 className="characterCreationSummaryTitle">
              {textData.characterCreation.freePoints}:
            </h2>
            <span className="characterCreationSummaryValue" data-tid="creation-points">
              {creationPoints}
            </span>
          </div>

          <h1 className="characterCreationTitle">{textData.characterCreation.title}</h1>

          <fieldset className="characterCreationStepGroup" aria-label="Point step">
            <h2 className="characterCreationStepTitle">Step:</h2>
            <div className="characterCreationStepOptions">
              {STEP_OPTIONS.map((value) => (
                <label
                  key={value}
                  className={`characterCreationStep ${pointStep === value ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="point-step"
                    value={value}
                    checked={pointStep === value}
                    onChange={() => setPointStep(value)}
                    className="characterCreationStepInput"
                  />
                  <span className="characterCreationStepLabel">x{value}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </header>

        <div className="characterCreationSections">
          <div className="characterCreationTopBlock">
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
          <TraitBlock
            heroId={heroId}
            freePoints={creationPoints}
            onTraitAdd={handleTraitAdd}
            onTraitRemove={handleTraitRemove}
          />
        </div>
      </section>

      <footer className="characterCreationFooter">
        <button type="button" className="characterCreationBtn ghost" onClick={handleBack}>
          {textData.characterCreation.backButton}
        </button>
        <button type="button" className="characterCreationBtn primary" onClick={handleStart}>
          {textData.characterCreation.startButton}
        </button>
      </footer>
    </div>
  );
};
