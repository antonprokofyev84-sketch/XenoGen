export interface ArmorTemplate {
  id: string;

  slot: 'armor' | 'outerwear' | 'accessory';
  price: number;
  dropRate: number;

  requiredStrength?: number;

  mods: Record<string, number>;

  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
}
