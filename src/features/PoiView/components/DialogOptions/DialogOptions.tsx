import { useState } from 'react';

import { PROTAGONIST_ID } from '@/constants';
import { SERVICE_RULES } from '@/data/poi.services';
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
  const changeTime = useGameState((state) => state.world.actions.changeTime);
  const money = useGameState((state) => state.inventory.containers[PROTAGONIST_ID]?.money ?? 0);
  const currentPoiId = useGameState(
    (state) => interactionSelectors.selectCurrentInteraction(state)?.poiId ?? null,
  );
  const parentId = useGameState((state) =>
    currentPoiId ? (poiSelectors.selectPoiById(currentPoiId)(state)?.parentId ?? null) : null,
  );

  const handleOptionClick = (optionId: InteractionService) => {
    setSelectedOption(optionId);
    const outcome = performService(optionId);

    //TODO следует подумать над архитектурой, возможно есть более чистые решения вызывать world экшены.
    if (optionId === 'leave' && parentId) {
      travelToPoi(parentId);
    }

    if (outcome?.success) {
      const timeCost = SERVICE_RULES[optionId]?.timeCost;
      if (timeCost) {
        changeTime(timeCost);
      }
    }
  };

  return (
    <div className="dialogOptions">
      <div className="sectionTitle">Actions</div>
      {actions.map((option) => {
        const cost = SERVICE_RULES[option.id]?.cost;
        const isDisabled =
          (option.maxExecutions !== undefined && option.executedTimes >= option.maxExecutions) ||
          (cost !== undefined && money < cost);

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
