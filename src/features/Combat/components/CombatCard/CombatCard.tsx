import type { EnemyInstance } from '@/types/enemy.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './CombatCharacterCard.scss';

interface CombatCardProps {
  character: EnemyInstance;
}

/**
 * A specialized character card for use on the combat screen.
 * It displays the character's art and their equipped weapon.
 */
export const CombatCard = ({ character }: CombatCardProps) => {
  const { templateId, rarity, appearanceVariation, faction, weapon } = character;

  // Construct the image URL based on character data
  const characterImageUrl = `/images/characters/${faction}/${templateId}_${appearanceVariation}.png`;
  // Construct the weapon image URL
  const weaponImageUrl = `/images/weapon/${weapon.id}.png`;

  return (
    <div className={`combatCard ${rarity}`}>
      <div className="image-container">
        <img src={assetsVersion(characterImageUrl)} alt={templateId} loading="lazy" />
      </div>

      {/* Updated block to display the equipped weapon with an icon */}
      <div className="weapon-display">
        <img className="weapon-icon" src={assetsVersion(weaponImageUrl)} alt={weapon.id} />
        <span className="weapon-name">{weapon.id}</span>
      </div>
    </div>
  );
};
