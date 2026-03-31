import { useState } from 'react';

import { RARITY_ORDER } from '@/constants';
import type { Rarity } from '@/types/common.types';

export const useRarityFilters = () => {
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set(RARITY_ORDER));

  const toggleRarity = (rarity: Rarity) => {
    setSelectedRarities((prev) => {
      const next = new Set(prev);
      if (next.has(rarity)) next.delete(rarity);
      else next.add(rarity);
      return next;
    });
  };

  return { selectedRarities, toggleRarity, ALL_RARITIES: RARITY_ORDER };
};
