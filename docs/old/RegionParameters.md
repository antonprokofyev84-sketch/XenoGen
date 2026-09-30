# Region Parameters

## Purpose

Region parameters describe the state of a root map cell and influence trade, encounters, enemies, NPC simulation, and local events.

The cell stores raw parameter values. Gameplay systems consume integer levels derived from those values. A POI may locally modify or override the levels without rewriting the cell's raw values.

---

## Data Scale

```ts
type RegionParameterKey =
  | 'prosperity'
  | 'techLevel'
  | 'contamination'
  | 'threat';

type RegionParameters = Record<RegionParameterKey, number>;
type RegionLevels = Partial<Record<RegionParameterKey, number>>;
```

```text
raw cell value → integer 0..999
level          → integer 0..9
```

The level is always calculated with integer division:

```ts
const level = Math.floor(rawValue / 100);
```

Examples:

| Raw value | Level |
|---:|---:|
| 0 | 0 |
| 20 | 0 |
| 100 | 1 |
| 599 | 5 |
| 999 | 9 |

There are exactly ten levels. A raw value such as `20` never becomes level `0.2`.

---

## Core Parameters

### prosperity

Prosperity represents the abundance of goods and market saturation.

It influences:

- how many goods traders carry;
- appearance chance of common goods;
- stock size for mass goods;
- rarity upgrade chance;
- prices where item-specific rules use local abundance.

```text
level 0 → almost no goods
level 5 → an established market
level 9 → abundant goods and large stocks
```

### techLevel

`techLevel` is the canonical field name throughout the model.

It represents access to infrastructure, technology, and complex goods. It influences:

- which trade items can appear;
- equipment available to enemies;
- access to advanced weapons, armor, implants, medicine, and genetic drugs.

```text
level 0 → primitive equipment and basic medicine
level 5 → developed weapons, armor, and medicine
level 9 → top-tier military, medical, and experimental technology
```

`techLevel` is access supplied by settlements, factions, laboratories, warehouses, and other infrastructure; it is not a physical property of the land.

### contamination

Contamination represents infection and environmental pollution. It influences:

- mutant and infected encounters;
- environmental hazards;
- infected goods;
- demand for medicine, filters, antidotes, and protective equipment;
- access to genetic and experimental drugs.

```text
level 0 → clean region
level 9 → severe infection and environmental danger
```

### threat

Threat represents combat danger and the experience of hostile forces. It influences:

- enemy experience and personal stats;
- encounter difficulty and outcomes;
- ambush probability;
- prices of combat goods where item rules use local demand.

```text
level 0 → weak or inexperienced enemies
level 9 → veterans, professionals, and highly dangerous fighters
```

Threat should primarily increase enemy quality and scenario danger, not simply enemy count.

---

## Responsibility Split

```text
prosperity   → how many goods are available
techLevel    → which goods and equipment are available
contamination → infection, mutants, and environmental danger
threat       → combat experience and encounter danger
```

Prosperity does not need to strengthen enemies directly. It may imply more guards, more valuable targets, and more populated trade locations.

---

## Static POI Levels

POIs do not receive another set of raw `0..999` values. They resolve final local integer levels from the root cell.

```ts
interface PoiTemplateDefinition {
  regionLevelOverrides?: RegionLevels;
  regionLevelModifiers?: RegionLevels;
}
```

Overrides and modifiers may coexist when they affect different parameters:

```ts
regionLevelOverrides: {
  techLevel: 6,
},

regionLevelModifiers: {
  prosperity: 2,
  threat: -1,
},
```

Resolution is independent for each parameter:

```ts
const cellLevel = Math.floor(
  rootCell.details.regionParameters[param] / 100,
);

const resolvedLevel =
  poiTemplate.regionLevelOverrides?.[param]
  ?? cellLevel + (poiTemplate.regionLevelModifiers?.[param] ?? 0);

const finalLevel = Math.min(9, Math.max(0, resolvedLevel));
```

Rules:

- if an override exists for a parameter, it is the final level;
- otherwise, the modifier is added to the root-cell level;
- if neither exists, the root-cell level is used;
- if the same key appears in both maps, the override wins and that modifier is ignored;
- the final result is always clamped to the integer range `0..9`.

The canonical resolver is the only place that combines raw cell values with POI template overrides and modifiers:

```ts
const REGION_PARAMETER_KEYS: RegionParameterKey[] = [
  'prosperity',
  'techLevel',
  'contamination',
  'threat',
];

type ResolvedRegionLevels = Record<RegionParameterKey, number>;

export function resolvePoiRegionLevels(
  rootCellParameters: RegionParameters,
  poiTemplate: PoiTemplateDefinition,
): ResolvedRegionLevels {
  return Object.fromEntries(
    REGION_PARAMETER_KEYS.map(param => {
      const cellLevel = Math.floor(rootCellParameters[param] / 100);
      const resolvedLevel =
        poiTemplate.regionLevelOverrides?.[param]
        ?? cellLevel + (poiTemplate.regionLevelModifiers?.[param] ?? 0);

      return [
        param,
        Math.min(9, Math.max(0, resolvedLevel)),
      ];
    }),
  ) as ResolvedRegionLevels;
}
```

Trade, encounters, enemy generation, and other consumers use this resolved object instead of repeating the calculation.

Examples:

```text
Slums:
- threat +1
- contamination +1
- prosperity -1

Farm:
- prosperity +1

Mutant nest:
- contamination +2

Raider camp:
- threat +1

Laboratory:
- techLevel override 7
- contamination +1

Travelling high-tech trader:
- techLevel override 6

Rich district:
- prosperity +2
```

For now, every nested POI resolves levels directly from its `rootCellId`. It does not inherit local modifiers or overrides from a parent POI. Parent-chain inheritance can be considered later if a real use case requires it.

---

## Dynamic Cell Changes

Static POI modifiers and overrides affect only the POI's local level context. Persistent world changes use `onDayPass` and modify raw root-cell values.

```ts
interface ChangeRegionParameterEffect {
  kind: 'changeRegionParameter';
  cellParam: RegionParameterKey;
  delta: number;

  chance?: number;
  min?: number;
  max?: number;
}
```

```ts
onDayPass: [
  {
    kind: 'changeRegionParameter',
    cellParam: 'contamination',
    delta: 1,
    chance: 0.3,
    max: 400,
  },
],
```

Semantics:

```text
delta  → raw-value change, not a level change
chance → independent probability, default 1
min    → optional lower boundary for this effect, default 0
max    → optional upper boundary for this effect, default 999
```

If several days pass, each effect gets an independent chance roll for each day. The effect targets the POI's root cell. Hidden POIs remain part of the simulation, so `isDiscovered: false` does not disable `onDayPass`.

An effect-specific boundary saturates a change at that boundary without pulling an already out-of-bound value backwards:

```text
current 398, delta +5, max 400 → 400
current 500, delta +5, max 400 → 500
current 2, delta -5, min 0     → 0
current -10, delta -5, min 0   → -10
```

---

## Deferred: Spread Between Cells

Some raw parameters may later influence neighboring cells:

- `threat`;
- `contamination`;
- `prosperity`.

Examples include raiders raising nearby threat, mutant nests raising contamination, and farms or markets raising prosperity.

`techLevel` should normally come from concrete infrastructure, factions, cities, warehouses, laboratories, military bases, and other POIs rather than spreading as a field.

The spread algorithm is outside the current initial-POI design.

---

## Threat and Technology Combinations

| Threat | Tech level | Meaning |
|---:|---:|---|
| 9 | 0 | Experienced enemies with primitive equipment |
| 9 | 9 | Elite enemies with top-tier equipment |
| 0 | 9 | Inexperienced enemies with advanced equipment |
| 5 | 5 | Moderate experience and moderate equipment |

The separation matters: threat determines how dangerous enemies are as fighters, while `techLevel` determines what equipment they can access.

---

## Integration Summary

```text
root cell stores raw values 0..999
Math.floor(raw / 100) produces integer level 0..9
POI override replaces one local level
POI modifier adjusts one root-cell level
resolver limits every final level to 0..9
onDayPass changes raw root-cell values
trade and encounters consume final local levels
```
