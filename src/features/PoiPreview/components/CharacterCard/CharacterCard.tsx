import type { EnemyInstance } from '@/types/enemy.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './CharacterCard.scss';

interface CharacterCardProps {
  character: EnemyInstance;
}

export const CharacterCard = ({ character }: CharacterCardProps) => {
  const { templateId, level, rarity, appearanceVariation, faction } = character;

  const imageUrl = `/images/characters/${faction}/${templateId}_${appearanceVariation}.png`;

  return (
    <div className={`characterCard ${rarity}`}>
      <div className="card-inner-border">
        <div className="image-container">
          <img src={assetsVersion(imageUrl)} alt={templateId} loading="lazy" />
        </div>
      </div>
      <footer className="card-footer">
        <span className="character-level">LVL {level}</span>
      </footer>
    </div>
  );
};
