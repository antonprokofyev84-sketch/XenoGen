import CapturedSvg from '@/assets/icons/captured.svg?react';
import { Button } from '@/components/Button/Button';
import { CharacterCard } from '@/components/CharacterCard/CharacterCard';
import type { CombatUnit } from '@/types/combat.types';
import type { Captive } from '@/types/party.types';

import './PrisonerCard.scss';

interface PrisonerCardProps {
  unit: CombatUnit | Captive;
  isCaptured: boolean;
  isLimitReached: boolean;
  onToggle: () => void;
}

export const PrisonerCard = ({ unit, isCaptured, isLimitReached, onToggle }: PrisonerCardProps) => {
  const { templateId, appearanceVariation, faction, rarity } = unit;

  const isDisabled = !isCaptured && isLimitReached;

  return (
    <div className={`prisonerCardWrapper ${isCaptured ? 'captured' : ''}`}>
      <div className="cardContainer">
        <CharacterCard
          templateId={templateId}
          appearanceVariation={appearanceVariation}
          faction={faction}
          rarity={rarity}
        />

        {isCaptured && (
          <div className="capturedIcon" title="Captured">
            <CapturedSvg className="svgIcon" />
          </div>
        )}
      </div>

      <Button
        variant="solid"
        color={isCaptured ? 'red' : 'green'}
        className="actionBtn"
        onClick={onToggle}
        disabled={isDisabled}
      >
        {isCaptured ? 'Release' : 'Capture'}
      </Button>
    </div>
  );
};
