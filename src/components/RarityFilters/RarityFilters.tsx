import type { Rarity } from '@/types/common.types';

import './RarityFilters.scss';

interface RarityFiltersProps {
  rarities: Rarity[];
  selected: Set<Rarity>;
  onToggle: (rarity: Rarity) => void;
}

export const RarityFilters = ({ rarities, selected, onToggle }: RarityFiltersProps) => (
  <div className="rarityFilters">
    {rarities.map((rarity) => (
      <label key={rarity} className={`rarityCheckbox ${rarity}`}>
        <input type="checkbox" checked={selected.has(rarity)} onChange={() => onToggle(rarity)} />
        <span className="checkmark" />
        <span className="labelName">{rarity}</span>
      </label>
    ))}
  </div>
);
