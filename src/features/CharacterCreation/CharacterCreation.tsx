import { useState } from 'react';

import { Button } from '@/components/Button/Button';
import { INITIAL_FACTIONS } from '@/data/initialFaction';
// import { INITIAL_MAP } from '@/data/initialMap';
import { INITIAL_POI } from '@/data/initialPoi';
import textData from '@/locales/en.json';
import { useGameState } from '@/state/useGameState';
import type { MainStatKey, SkillKey } from '@/types/character.types';

import { MainStatsBlock } from './components/MainStatsBlock/MainStatsBlock';
import { SecondaryStatsBlock } from './components/SecondaryStatsBlock/SecondaryStatsBlock';
import { SkillsBlock } from './components/SkillsBlock/SkillsBlock';
import { TraitBlock } from './components/TraitBlock/TraitBlock';

import './CharacterCreation.scss';

const INITIAL_CREATION_POINTS = 1500;
const MIN_STAT = 15;
const MAX_STAT = 500;
const MIN_SKILL = 0;
const MAX_SKILL = 50;

const STEP_OPTIONS = [1, 5, 10] as const;

export const CharacterCreation = () => {
  const [creationPoints, setCreationPoints] = useState(INITIAL_CREATION_POINTS);
  const [pointStep, setPointStep] = useState<number>(5);

  const protagonistId = useGameState((state) => state.characters.protagonistId);
  const characterActions = useGameState((state) => state.characters.actions);
  const traitActions = useGameState((state) => state.traits.actions);
  const goToScreen = useGameState((state) => state.ui.goToScreen);
  const initializeFactions = useGameState((state) => state.factions.actions.initializeFactions);
  // const initializeMap = useGameState((state) => state.map.actions.initializeMap);
  const initializePois = useGameState((state) => state.poiSlice.actions.initializePois);

  const addItem = useGameState((state) => state.inventory.actions.addItem);

  const handleStatChange = (statKey: MainStatKey, delta: number) => {
    characterActions.changeMainStat(protagonistId, statKey, delta);
    setCreationPoints((p) => p - delta);
  };

  const handleSkillChange = (skillKey: SkillKey, delta: number) => {
    characterActions.changeSkill(protagonistId, skillKey, delta);
    setCreationPoints((p) => p - delta);
  };

  const handleTraitAdd = (traitId: string, traitCost?: number) => {
    traitActions.addTraitToCharacter(protagonistId, traitId);
    setCreationPoints((p) => p - (traitCost ?? 0));
  };

  const handleTraitRemove = (traitId: string, traitCost?: number) => {
    traitActions.removeTraitFromCharacter(protagonistId, traitId);
    setCreationPoints((p) => p + (traitCost ?? 0));
  };

  const handleBack = () => {
    characterActions.resetProtagonist();
    traitActions.resetCharacterTraits(protagonistId);
    setCreationPoints(INITIAL_CREATION_POINTS);
    goToScreen('mainMenu');
  };

  const handleStart = () => {
    characterActions.finalizeCharacterCreation(protagonistId);

    initializeFactions(INITIAL_FACTIONS);
    // initializeMap(INITIAL_MAP);
    initializePois(INITIAL_POI);

    //test
    // addItem({
    //   templateId: 'fireAxe',
    //   rarity: 'uncommon',
    //   type: 'meleeWeapon',
    //   quantity: 3,
    // });
    // addItem({
    //   templateId: 'pumpShotgun',
    //   rarity: 'uncommon',
    //   type: 'rangeWeapon',
    //   quantity: 3,
    // });
    // addItem({
    //   templateId: 'makeshiftKnife',
    //   rarity: 'unique',
    //   type: 'meleeWeapon',
    //   quantity: 3,
    // });
    // addItem({
    //   templateId: 'reinforcedLeatherArmor',
    //   rarity: 'rare',
    //   type: 'armor',
    //   quantity: 3,
    // });

    goToScreen('strategicMap');
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
            freePoints={creationPoints}
            onTraitAdd={handleTraitAdd}
            onTraitRemove={handleTraitRemove}
          />
        </div>
      </section>

      <footer className="characterCreationFooter">
        <Button type="button" variant="outline" color="red" onClick={handleBack}>
          {textData.characterCreation.backButton}
        </Button>
        <Button type="button" variant="outline" color="green" onClick={handleStart}>
          {textData.characterCreation.startButton}
        </Button>
      </footer>
    </div>
  );
};
