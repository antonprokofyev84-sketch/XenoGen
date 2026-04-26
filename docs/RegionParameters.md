# Region Parameters

## Purpose

Region parameters describe the state of a map cell and influence trading, encounters, enemies, and local events.

Base values come from the cell. Points of interest inside the cell can apply local modifiers.

---

## Core Parameters

### prosperity

Prosperity represents the abundance of goods and market saturation in the region.

Influences:
- amount of goods available from traders;
- chance that common goods are present;
- stock size for mass goods;
- rarity upgrade chance for items.

Examples:
- `prosperity 1` — almost no goods.
- `prosperity 5` — average market.
- `prosperity 10` — many goods and large stock.

---

### supplyTier / techLevel

Supply tier represents access to technology and complex goods.

Influences:
- which items can appear;
- maximum complexity of weapons, armor, implants, medicine, genetic drugs, and other advanced goods;
- enemy equipment quality.

Examples:
- `supplyTier 1` — primitive weapons, basic medicine, simple equipment.
- `supplyTier 5/10` — advanced weapons, armor, implants, rare medicine, high-tech goods.

Supply tier is better treated as access to supply and infrastructure, not as a physical property of the land.

---

### contamination

Contamination represents how infected or polluted the region is.

Influences:
- mutant spawn;
- infected events;
- infected goods;
- demand and price for medicine, filters, antidotes, protective equipment;
- access to genetic or experimental drugs.

Examples:
- `contamination 1` — clean region.
- `contamination 10` — mutants, infected events, dangerous environment, high demand for protection.

---

### threat

Threat represents combat danger in the region.

Influences:
- enemy experience level;
- enemy personal stats;
- encounter difficulty;
- chance of bad encounter outcomes;
- chance of ambush when moving between cells;
- prices of weapons, armor, ammunition, medicine, combat stimulants;
- price of slaves or captives, if appropriate for the setting.

Examples:
- `threat 1` — weak or inexperienced enemies.
- `threat 10` — veterans, professionals, killers, dangerous fighters.

---

## Role Separation

```text
prosperity = how many goods are available.
supplyTier = which goods and equipment are available.
contamination = infection, mutants, infected events.
threat = combat experience and danger of encounters.
```

---

## POI Modifiers

Base parameters come from the cell.

POIs inside the cell can locally modify those parameters.

Examples:

```text
Slums:
- threat +1
- contamination +1
- prosperity -1

Farm:
- prosperity +1

Mutant nest:
- contamination +1/+2

Raider camp:
- threat +1/+2

Laboratory:
- supplyTier +1/+2
- contamination +1

Rich club:
- prosperity +2
- threat -1

Black market:
- threat +1/+2
- supplyTier +1
```

Final values for trading and encounters are calculated from the cell parameters plus POI modifiers.

```ts
finalProsperity = cell.prosperity + pointOfInterest.prosperityModifier;
finalThreat = cell.threat + pointOfInterest.threatModifier;
finalContamination = cell.contamination + pointOfInterest.contaminationModifier;
finalSupplyTier = cell.supplyTier + pointOfInterest.supplyTierModifier;
```

Final values should be clamped to the allowed range, for example `1–10` or `1–5`.

---

## Spread Between Cells

Some parameters can slowly influence neighboring cells:

- `threat`;
- `contamination`;
- `prosperity`.

Examples:
- raiders increase threat around them;
- mutants increase contamination around them;
- farms and markets increase prosperity around them.

`supplyTier` should usually not spread like a field.

Supply tier should come from:
- infrastructure;
- faction presence;
- city level;
- warehouses;
- laboratories;
- military bases;
- specific POIs.

---

## Enemies And Encounters

### threat

Threat affects:
- enemy experience;
- enemy stats;
- encounter danger;
- chance of bad scenario;
- chance of ambush when moving between cells.

High threat means enemies are more dangerous as fighters.

---

### supplyTier

Supply tier affects enemy equipment:
- weapons;
- armor;
- gadgets;
- technological abilities.

---

### contamination

Contamination affects:
- mutants;
- infected enemies;
- infected events;
- environmental danger.

---

### prosperity

Prosperity does not need to directly affect enemies.

It can indirectly imply:
- more guards;
- more valuable targets for raiders;
- more trade POIs;
- more populated locations.

---

## Threat + SupplyTier Combinations

### threat 10 + supplyTier 1

Experienced enemies with primitive equipment.

Examples:
- veteran raiders;
- brutal survivors;
- old fighters;
- dangerous low-tech gangs.

They are dangerous because of experience, stats, and behavior.

---

### threat 10 + supplyTier 10

Experienced enemies with top-tier equipment.

Examples:
- special forces;
- corporate troops;
- elite mercenaries.

This is a maximum danger scenario.

---

### threat 1 + supplyTier 10

Inexperienced enemies with advanced equipment.

Examples:
- rich amateurs;
- poorly trained security;
- spoiled elites playing war.

They are dangerous because of their equipment, but they use it poorly.

---

### threat 5 + supplyTier 5

Average region.

Enemies have moderate experience and moderate equipment.

---

## Practical Meaning

High threat should not simply mean many enemies.

Better effects:
- stronger enemies;
- better enemy stats;
- worse encounter scenarios;
- slightly higher chance of ambush;
- slightly higher chance of combat escalation.

High contamination is better suited for increasing mutant presence and infected events.
