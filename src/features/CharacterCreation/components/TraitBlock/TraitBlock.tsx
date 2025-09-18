import { useGameStore, traitsSelectors } from '@/state/useGameState';
import { TraitsRegistry } from '@/systems/traits/traitsRegistry';
import textData from '@/locales/en.json';
import './TraitBlock.scss';
import { TraitsManager } from '@/systems/traits/traitsManager';

interface TraitBlockProps {
  heroId: string;
  freePoints: number;
  onTraitAdd: (traitId: string, cost?: number) => void;
  onTraitRemove: (traitId: string, cost?: number) => void;
}

export const TraitBlock = ({ heroId, freePoints, onTraitAdd, onTraitRemove }: TraitBlockProps) => {
  const heroTraits = useGameStore(traitsSelectors.selectTraitsByCharacterId(heroId)) ?? [];
  const startingTraits = TraitsRegistry.getStartingChoices();

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
        {startingTraits.map((trait) => {
          const isPicked = heroTraits.some((t) => t.id === trait.id);
          const traitCost = trait.cost ?? 0;

          let isDisabled = false;
          if (!isPicked) {
            const hasEnoughPoints = freePoints >= traitCost;
            isDisabled =
              !hasEnoughPoints || TraitsManager.canAddTrait(trait.id, heroTraits) === false;
          }

          return (
            <div key={trait.id} className="traitItem">
              <input
                type="checkbox"
                id={`trait-${trait.id}`}
                className="traitCheckbox"
                checked={isPicked}
                disabled={isDisabled}
                onChange={() => handleTraitToggle(trait.id, trait.cost, isPicked)}
              />
              <label htmlFor={`trait-${trait.id}`} className="traitLabel">
                <span className="traitName">
                  {textData.traits[trait.id as keyof typeof textData.traits]?.name || trait.nameKey}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
};
