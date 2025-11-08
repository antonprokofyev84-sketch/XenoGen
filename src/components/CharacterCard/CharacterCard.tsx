import type { Rarity } from '@/types/common.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './CharacterCard.scss';

interface CharacterCardProps {
  templateId: string;
  appearanceVariation: number;
  faction: string;
  rarity: Rarity;
  level?: number;
}

export const CharacterCard = ({
  templateId,
  level,
  rarity,
  appearanceVariation,
  faction,
}: CharacterCardProps) => {
  const imageUrl = `/images/characters/${faction}/${templateId}_${appearanceVariation}.png`;

  return (
    <div className={`characterCard ${rarity}`}>
      <div className="cardInnerBorder">
        <div className="imageContainer">
          <img src={assetsVersion(imageUrl)} alt={templateId} loading="lazy" />
        </div>
      </div>
      {level && (
        <footer className="cardFooter">
          <span className="characterLevel">LVL {level}</span>
        </footer>
      )}
    </div>
  );
};
