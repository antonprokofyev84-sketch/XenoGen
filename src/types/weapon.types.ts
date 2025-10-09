export interface WeaponTemplate {
  id: string;
  slot: 'melee' | 'range';
  price: number;
  dropRate: number;
  requiredStrength?: number;
  requiredMelee?: number;
  requiredRanged?: number;
  distance: number;
  attacksPerTurn: number;
  damage: [min: number, max: number];
  armorPiercing: number;
  mods?: Record<string, number>;
}
