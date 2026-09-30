# Trade System

> **Document status:** this is a collection of trade-system ideas and candidate balance rules. The regional input contract and canonical field names are aligned with the other design documents; formulas, coefficients, probability tables, and caps marked as suggested or exemplary are not yet final balance decisions.

## Purpose

The trade system combines final regional levels, trader profiles, item definitions, soft technology gates, and rarity rolls to generate stock without maintaining many nearly identical hand-written lists.

---

## Regional Inputs

```text
prosperity   → how many goods are available
techLevel    → which goods can appear
contamination → infected goods and demand for protection
threat       → combat demand and local danger
```

`techLevel` is the canonical technology-access field throughout the trade model.

Trade works only with final integer levels in the range `0..9`:

```ts
type TradeContext = {
  prosperity: number;
  threat: number;
  contamination: number;
  techLevel: number;
};
```

The values are resolved before stock generation by the canonical region resolver:

```ts
const tradeContext: TradeContext = resolvePoiRegionLevels(
  rootCell.details.regionParameters,
  poiTemplate,
);
```

The resolver converts raw root-cell values, applies the current POI template override or modifier, and returns final integer levels `0..9`. Trade does not perform its own conversion, clamping, or POI inheritance logic.

---

## Trade Item Definition

```ts
type TradeItemDefinition = {
  id: string;

  minProsperity?: number;
  maxProsperity?: number;

  minThreat?: number;
  maxThreat?: number;

  minContamination?: number;
  maxContamination?: number;

  minTechLevel?: number;
  maxTechLevel?: number;

  prosperityPriceModifier?: number;
  threatPriceModifier?: number;
  contaminationPriceModifier?: number;
  techLevelPriceModifier?: number;
};
```

All min/max fields refer to final levels `0..9`, not raw values `0..999`.

An item definition may describe:

- where the item can appear;
- whether technology soft gating applies;
- how regional levels affect its price.

---

## Trader Profile

A trader profile defines the item pool the trader can potentially sell.

Example weapon pool:

```text
rusty_pistol
pistol
shotgun
assault_rifle
plasma_rifle
```

The regional context then filters and modifies this pool:

- low `techLevel` favors primitive items;
- high `techLevel` unlocks advanced items;
- high `prosperity` increases stock and appearance chance;
- high `threat` can increase prices of combat goods;
- high `contamination` can unlock infected, genetic, or experimental goods and increase demand for protection.

---

## Tech Level Soft Gate

`minTechLevel` can use a soft gate instead of a strict boolean filter.

```ts
const difference = item.minTechLevel - context.techLevel;
```

Suggested availability:

| Difference | Appearance rule |
|---:|---|
| `<= 0` | available normally |
| `1` | 50% chance |
| `2` | 10% chance |
| `>= 3` | unavailable |

```ts
const techLevelSoftGateChanceByDifference = {
  0: 1,
  1: 0.5,
  2: 0.1,
};
```

This allows a slightly higher-tech item to appear rarely without dissolving technological progression.

`maxTechLevel`, when specified, remains an ordinary upper condition rather than part of this soft gate.

---

## Stock Amount

### Mass Goods

Examples:

- bandages;
- ammunition;
- food;
- cheap medicine;
- water;
- filters.

For mass goods, the trader defines a base amount and prosperity modifies it:

```text
finalAmount = baseAmount * prosperityStockModifier
```

The exact prosperity-to-stock curve is a balance value and is not fixed here.

### Rare or Single Goods

Examples:

- weapons;
- implants;
- rare drugs;
- captives;
- unique modules.

For rare goods:

- amount is usually `1`;
- prosperity affects appearance chance;
- `techLevel` controls access;
- the soft gate may allow a small chance above the current level.

---

## Rarity

```ts
type ItemRarity = 'normal' | 'uncommon' | 'rare' | 'unique';
```

An item first passes its appearance checks. It may then roll an upgraded rarity.

Suggested upgrade chance:

```ts
const minTechLevel = item.minTechLevel ?? 0;

const rarityUpgradeChance =
  context.prosperity * 0.02
  + Math.max(0, context.techLevel - minTechLevel) * 0.10;
```

Example:

```text
minTechLevel = 1
final prosperity = 5
final techLevel = 5

prosperity bonus = 5 × 2% = 10%
technology bonus = (5 - 1) × 10% = 40%
total = 50%
```

An optional cap can keep common low-tech goods from almost always upgrading in rich high-tech locations:

```ts
const maxRarityUpgradeChance = 0.7;
```

If the upgrade succeeds, perform one rarity roll:

```ts
const rarityUpgradeRoll = [
  { rarity: 'uncommon', weight: 80 },
  { rarity: 'rare', weight: 15 },
  { rarity: 'unique', weight: 5 },
];
```

The `0.02` and `0.10` coefficients, the `0.7` cap, and the rarity weights above are examples for later balancing rather than fixed system constants.

---

## Price Logic

Price starts from the item's base price and uses item-specific regional modifiers.

Suggested responsibilities:

- `threat` may raise prices of weapons, armor, ammunition, medicine, and combat stimulants;
- `contamination` may raise prices of filters, antidotes, medicine, and protective gear;
- `prosperity` may lower prices of common abundant goods;
- `techLevel` is primarily an availability input but may affect price for selected items.

There is no single global rule such as “high threat raises every price.” Each item opts into the relevant modifiers.

---

## Example Item Conditions

### bandage

```ts
{
  id: 'bandage',
  minTechLevel: 0,
  threatPriceModifier: 0.05,
  contaminationPriceModifier: 0.05,
}
```

Appears almost everywhere and can become more expensive in dangerous or contaminated regions.

### genetic_drug

```ts
{
  id: 'genetic_drug',
  minTechLevel: 7,
  minContamination: 5,
}
```

A rare good associated with infected or laboratory zones.

### combat_stimulant

```ts
{
  id: 'combat_stimulant',
  minTechLevel: 4,
  minThreat: 4,
}
```

More likely in technologically developed and dangerous regions.

### plasma_rifle

```ts
{
  id: 'plasma_rifle',
  minTechLevel: 8,
  threatPriceModifier: 0.05,
}
```

A high-tech weapon whose price may respond to combat demand.

### luxury_alcohol

```ts
{
  id: 'luxury_alcohol',
  minProsperity: 6,
  maxThreat: 5,
}
```

It becomes uncommon or disappears in poor, highly dangerous markets.

---

## Stock Generation Flow

1. Receive the already resolved final `TradeContext` for the current POI.
2. Take the trader profile's possible item pool.
3. For each item, check prosperity, threat, and contamination conditions.
4. Apply the `techLevel` soft gate.
5. For each passing item, roll appearance, generate amount, roll rarity, and calculate price.
6. Return the generated stock.

```text
TraderProfile       → what this trader may sell
TradeItemDefinition → where and under which conditions it may appear
prosperity           → amount and rarity chance
techLevel            → access and rarity chance
threat               → combat demand and danger
contamination        → infected economy and protective demand
```
