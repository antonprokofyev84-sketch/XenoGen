import { useState } from 'react';

import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import type { InteractionService } from '@/types/interaction.types';

import './DialogOptions.scss';

export const DialogOptions = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const actions = useGameState(
    (state) => state.interactionSlice.currentInteraction?.services ?? [],
  );
  const performService = useGameState((state) => state.interactionSlice.actions.performService);
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);
  const currentPoiId = useGameState(
    (state) => interactionSelectors.selectCurrentInteraction(state)?.poiId ?? null,
  );
  const parentId = useGameState((state) =>
    currentPoiId ? (poiSelectors.selectPoiById(currentPoiId)(state)?.parentId ?? null) : null,
  );

  const handleOptionClick = (optionId: InteractionService) => {
    setSelectedOption(optionId);
    performService(optionId);

    if (optionId === 'leave' && parentId) {
      travelToPoi(parentId);
    }
  };

  return (
    <div className="dialogOptions">
      <div className="sectionTitle">Actions</div>
      {actions.map((option) => {
        const isDisabled =
          option.maxExecutions !== undefined && option.executedTimes >= option.maxExecutions;

        return (
          <button
            key={option.id}
            className={`dialogOption ${selectedOption === option.id ? 'selected' : ''}`}
            onClick={() => handleOptionClick(option.id)}
            disabled={isDisabled}
          >
            {option.id}
          </button>
        );
      })}
    </div>
  );
};
