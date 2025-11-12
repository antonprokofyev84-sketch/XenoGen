import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { traitsSelectors, useGameState } from '@/state/useGameState';
import { traitsManager } from '@/systems/traits/traitsManager';
import { traitsRegistry } from '@/systems/traits/traitsRegistry';

import './TraitBlock.scss';

interface TraitBlockProps {
  freePoints: number;
  onTraitAdd: (traitId: string, cost?: number) => void;
  onTraitRemove: (traitId: string, cost?: number) => void;
}

export const TraitBlock = ({ freePoints, onTraitAdd, onTraitRemove }: TraitBlockProps) => {
  const protagonistId = useGameState(useShallow((state) => state.characters.protagonistId));
  const protagonistTraits =
    useGameState(useShallow(traitsSelectors.selectTraitsByCharacterId(protagonistId))) ?? [];
  const startingTemplates = traitsRegistry.getStartingChoices(); // TraitTemplate[]

  const handleTraitToggle = (
    traitId: string,
    cost: number | undefined,
    isCurrentlyPicked: boolean,
  ) => {
    if (isCurrentlyPicked) {
      onTraitRemove(traitId, cost);
    } else {
      onTraitAdd(traitId, cost);
    }
  };

  return (
    <section className="traitBlock">
      <h2 className="traitBlockTitle">{textData.characterCreation.traitsTitle}</h2>

      <div className="traitGrid">
        {startingTemplates.map((template) => {
          const levelZero = traitsRegistry.resolveLevel(template.id, 0);
          const traitCost = levelZero?.cost ?? 0;

          const isPicked = protagonistTraits.some((t) => t.id === template.id);

          let isDisabled = false;
          if (!isPicked) {
            const hasEnoughPoints = freePoints >= traitCost;
            isDisabled =
              !hasEnoughPoints ||
              traitsManager.canAddTrait(template.id, protagonistTraits) === false;
          }

          const nameFromLocale =
            textData.traits[template.id as keyof typeof textData.traits]?.name ?? template.nameKey;

          return (
            <div key={template.id} className="traitItem">
              <input
                id={`trait-${template.id}`}
                className="traitCheckbox"
                type="checkbox"
                checked={isPicked}
                disabled={isDisabled}
                onChange={() => handleTraitToggle(template.id, traitCost, isPicked)}
              />
              <label htmlFor={`trait-${template.id}`} className="traitLabel">
                <span className="traitName">{nameFromLocale}</span>
                {/* при желании можно вывести цену:
                <span className="traitCost">{traitCost > 0 ? `+${traitCost}` : traitCost}</span> */}
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
};
