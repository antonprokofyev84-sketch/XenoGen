# Trade System

## Purpose

The trade system uses region parameters, POI modifiers, trader profiles, item definitions, soft supply gates, and rarity rolls to generate trader stock without manually writing many separate trade lists.

---

## Main Concepts

```text
prosperity = how many goods are available.
supplyTier = which goods can appear.
contamination = infected goods, medicine demand, filters, mutants.
threat = combat demand, danger, weapon/medicine prices.
```

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

  minSupplyTier?: number;
  maxSupplyTier?: number;

  prosperityPriceModifier?: number;
  threatPriceModifier?: number;
  contaminationPriceModifier?: number;
  supplyTierPriceModifier?: number;
};
```

Item definitions can describe:
- appearance requirements by prosperity;
- appearance requirements by threat;
- appearance requirements by contamination;
- appearance requirements by supply tier;
- price modifiers from regional parameters.

---

## Trader Profile

A trader has a list of items they can potentially sell.

Example weapon trader pool:

```text
rusty_pistol
pistol
shotgun
assault_rifle
plasma_rifle
```

The final stock is filtered and modified by region parameters:

- low `supplyTier` leaves only primitive items;
- high `supplyTier` unlocks advanced items;
- high `prosperity` gives more goods;
- high `threat` increases prices of combat goods;
- high `contamination` can unlock infected, genetic, or experimental goods.

---

## Local Trade Context

Trade should use final POI-adjusted parameters.

```ts
type TradeContext = {
  prosperity: number;
  threat: number;
  contamination: number;
  supplyTier: number;
};
```

These values come from:

```text
cell parameters + POI modifiers
```

---

## Supply Tier Soft Gate

Each item can have a required supply tier.

Instead of a hard yes/no gate, supply tier can use soft gating.

```text
difference = requiredSupplyTier - finalSupplyTier
```

Suggested chances:

```text
difference <= 0:
- item is available normally

difference 1:
- item can appear with 50% chance

difference 2:
- item can appear with 10% chance

difference 3+:
- item cannot appear
```

Example:

```ts
const supplyTierSoftGateChanceByDifference = {
  0: 1,
  1: 0.5,
  2: 0.1,
};
```

This allows rare higher-tech goods to occasionally appear in slightly lower-tech places without fully breaking progression.

---

## Stock Amount

Items should be split into two broad groups.

---

### Mass Goods

Examples:
- bandages;
- ammunition;
- food;
- cheap medicine;
- water;
- filters.

For mass goods:
- the trader defines base amount;
- `prosperity` modifies the amount.

Example:

```text
finalAmount = baseAmount * prosperityStockModifier
```

---

### Rare / Single Goods

Examples:
- weapons;
- implants;
- rare drugs;
- slaves;
- unique modules.

For rare goods:
- amount is usually `1`;
- `prosperity` affects chance of appearance;
- `supplyTier` decides whether the item can appear;
- soft gate can allow low chance above current supply tier.

---

## Rarity

Possible item rarities:

```ts
type ItemRarity = 'normal' | 'uncommon' | 'rare' | 'unique';
```

Rarity can be generated as an upgrade from the normal item.

---

## Rarity Upgrade Chance

The chance for an item to roll upgraded rarity can depend on:
- prosperity;
- how much final supply tier exceeds the item required supply tier.

Suggested formula:

```text
rarityUpgradeChance =
  prosperity * 0.02
  + max(0, finalSupplyTier - requiredSupplyTier) * 0.10
```

Example:

```text
knife requiredSupplyTier = 1
finalProsperity = 5
finalSupplyTier = 5

prosperity bonus = 5 * 2% = 10%
supply bonus = (5 - 1) * 10% = 40%

total rarityUpgradeChance = 50%
```

The knife appears normally, but has a 50% chance to roll upgraded rarity.

Optional cap:

```text
maxRarityUpgradeChance = 70%
```

This prevents all low-tech items in rich high-tech locations from always becoming upgraded.

---

## Rarity Roll

If the rarity upgrade chance succeeds, make one additional rarity roll.

Suggested distribution:

```text
80% uncommon
15% rare
5% unique
```

Example:

```ts
const rarityUpgradeRoll = [
  { rarity: 'uncommon', weight: 80 },
  { rarity: 'rare', weight: 15 },
  { rarity: 'unique', weight: 5 },
];
```

The numbers can be changed later during balancing.

---

## Price Logic

Price starts from base item price and is modified by item-specific modifiers.

Suggested meaning:

- `threat` increases price of weapons, armor, ammunition, medicine, combat stimulants;
- `contamination` increases price of filters, antidotes, medicine, protective gear;
- `prosperity` can reduce price of common goods due to abundance;
- `supplyTier` is usually better as an availability filter, but can also modify price if needed.

---

## Example Items

### bandage

```text
minSupplyTier: 1
```

Appears almost everywhere.

Can become more expensive from:
- threat;
- contamination.

---

### genetic_drug

```text
minSupplyTier: high
minContamination: high
```

Rare good for infected or laboratory zones.

---

### combat_stimulant

```text
minThreat: medium/high
minSupplyTier: medium
```

More common and more expensive in dangerous areas.

---

### plasma_rifle

```text
minSupplyTier: high
```

High-tech weapon.

Threat can increase price.
Prosperity can affect chance or amount.

---

### luxury_alcohol

```text
minProsperity: high
maxThreat: low/medium
```

Can disappear or become less common in dangerous regions.

---

## Generation Flow

Suggested simple generation flow:

```text
1. Get final trade context:
   cell parameters + POI modifiers.

2. Take trader's possible item pool.

3. For each item:
   - check prosperity requirements;
   - check threat requirements;
   - check contamination requirements;
   - check supply tier soft gate.

4. If item passes:
   - roll appearance chance if needed;
   - generate amount;
   - roll rarity upgrade;
   - calculate price.

5. Return final trader stock.
```

---

## Practical Summary

```text
Trader defines what can be sold.
TradeItemDefinition defines where and under which conditions it can appear.
Prosperity controls amount and rarity chance.
SupplyTier controls access and rarity chance.
Threat controls combat-market pressure and enemy danger.
Contamination controls infected economy and mutant pressure.
```
