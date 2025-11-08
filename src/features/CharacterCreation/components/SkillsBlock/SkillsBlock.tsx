import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { characterSelectors, useGameState } from '@/state/useGameState';
import type { SkillKey } from '@/types/character.types';

import './SkillsBlock.scss';

interface SkillsBlockProps {
  freePoints: number;
  onSkillChange: (skillKey: SkillKey, delta: number) => void;
  pointStep?: number;
  minSkill?: number;
  maxSkill?: number;
}

export const SkillsBlock = ({
  freePoints,
  onSkillChange,
  pointStep = 5,
  // minSkill = 0,
  maxSkill = 50,
}: SkillsBlockProps) => {
  console.log('SkillsBlock render');
  const protagonistId = useGameState(useShallow((state) => state.characters.protagonistId));
  const skills = useGameState(useShallow(characterSelectors.selectSkills(protagonistId)));
  const effectiveSkills = useGameState(
    useShallow(characterSelectors.selectEffectiveSkills(protagonistId)),
  );
  const baseSkills = useGameState(useShallow(characterSelectors.selectBaseSkills(protagonistId)));
  const skillKeys = Object.keys(skills) as SkillKey[];

  return (
    <div className="skillsBlock">
      <h2 className="skillsHeader">{textData.characterCreation.skillsTitle}</h2>
      {skillKeys.map((skillKey) => {
        const currentSkillValue = skills[skillKey] + baseSkills[skillKey];
        const effectiveSkillValue = effectiveSkills[skillKey] + baseSkills[skillKey];
        const canAdd = freePoints >= pointStep && currentSkillValue + pointStep <= maxSkill;
        const canRemove = currentSkillValue > baseSkills[skillKey];

        return (
          <div className="skillRow" key={skillKey}>
            <span className="skillName">{textData.skills[skillKey]}</span>
            <span className={`skillValue ${canRemove ? 'skillValueAdded' : ''}`}>
              {effectiveSkillValue}
            </span>
            <div className="skillButtons">
              <button
                className="skillButton remove"
                onClick={() => onSkillChange(skillKey, -pointStep)}
                disabled={!canRemove}
              >
                -{pointStep}
              </button>
              <button
                className="skillButton add"
                onClick={() => onSkillChange(skillKey, pointStep)}
                disabled={!canAdd}
              >
                +{pointStep}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
