# NPC + Spatial System Design (v2)

## Purpose

This document describes the final v1 NPC system built on top of the POI system.

It focuses on:

- POI data needed for NPC support;
- the NPC registry;
- the Spatial registry;
- slot-scoped runtime distribution;
- interaction flow between POI scene services and NPC personal services.

This v1 is intentionally simple.
It is not a world simulation.
It is a slot-scoped scene population system for the current active cell.

Related documents:

- [PoiSystem](./PoiSystem.md)
- [NarrativeSystem](./NarrativeSystem.md)
- [TradeSystem](./TradeSystem.md)

---

## Design Goals

The v1 NPC system should:

- keep POIs static;
- remove runtime occupancy state from POIs;
- introduce NPCs as separate entities;
- have one clear source of truth for current NPC placement;
- support simple schedule-based placement;
- support work spots and free-time spots;
- allow facilities to be considered open or closed;
- allow occupied POIs to switch from scene services into NPC-specific services;
- keep one NPC at most per POI.

---

## Core Layers

The final v1 model is built from three layers.

### POI

POIs are static authored scene configuration.

They describe:

- scene structure;
- local services;
- discovery rules;
- narrative and image context;
- which NPCs may use which spots.

POIs do not describe where NPCs currently are.

### NPC

NPCs are static actor definitions.

They describe:

- identity;
- faction alignment;
- affection toward the player;
- personal services;
- schedule.

NPCs do not store their current POI.

### Spatial

Spatial is the runtime registry for the current slot.

It describes:

- where each currently visible NPC is placed;
- which NPC occupies each currently resolved POI.

Spatial is the only source of truth for current placement.

---

## POI Contracts For NPC Support

POIs are static authored scene configuration using the universal v2 model.
There are no runtime category types (`facility`, `spot`, etc.) — the template DB key is the content key.

NPC-related placement hints (`managerIds`, `allowedNpcIds`, `spotPurpose`) are **not** part of `UniversalPoiDetails` in the current codebase. They are planned extensions to be authored in template `details` when the NPC spatial distribution system is implemented.

### Planned template shape for facility

```ts
// Content key: "tavern"
// Template entry:
tavern: {
  details: {
    // future NPC hint fields:
    // managerIds?: string[];
  },
  services: ['rest', 'leave'],
}
```

A facility node is considered open if at least one `managerId` is currently scheduled to `work` in the current time slot.

### Planned template shape for local spot

```ts
// Content key: "tavern_bartender_spot"
// Template entry:
tavern_bartender_spot: {
  isLocalSpot: true,   // node goes into parent.localSpotIds
  details: {
    // future NPC hint fields:
    // spotPurpose?: 'work' | 'free_time';
    // allowedNpcIds?: string[];
  },
  services: ['trade', 'leave'],
}
```

`isLocalSpot: true` means the node is created with `isLocalSpot = true` and linked into `parent.localSpotIds`,
enabling the 5-minute LOCAL_SPOT_MOVE transition cost.

### Resulting POI role in v2

POIs are responsible for:

- authored scene structure;
- local services;
- narrative and image lookup context (`poiType` content key);
- `isLocalSpot` flag routing child nodes to `localSpotIds`.

POIs are not responsible for:

- current runtime ownership;
- current runtime occupancy;
- storing where NPCs are right now.

---

## NPC Registry

NPCs are stored as actor definitions and social state.

They do not need `homeCellId` in v1.
For the current active cell, candidate NPCs are derived from template `details` fields (`managerIds`, `allowedNpcIds`) once those are authored.

### Base NPC shape

```ts
export interface NpcDetails {
  id: string;
  name: string;
  factionId: string;

  affection: number;
  lastDateMet: number | null;

  personalServiceIds: string[];

  schedule: Record<
    number,
    {
      action: 'work' | 'free_time' | 'hidden';
    }
  >;
}
```

### Field meaning

#### `id`

Unique NPC identifier.

#### `name`

Display name.

#### `factionId`

NPC faction alignment.

#### `affection`

Personal relationship value toward the player.

#### `lastDateMet`

Tracks the last time the player met this NPC.

#### `personalServiceIds`

Services that belong to the NPC personally rather than to the POI.
These services become available after entering NPC interaction through `talk`.

Examples:

- `flirt`
- `hire`
- `askRumors`

#### `schedule`

Defines what the NPC is doing in each time slot.

Current action values:

- `work`
- `free_time`
- `hidden`

The schedule does not point to a specific POI.
It only expresses the NPC's current activity type.

---

## Spatial State

Spatial is a separate runtime registry.

It is the only source of truth for where NPCs are currently placed.
In v1 each POI can have at most one occupant.

### State shape

```ts
export interface SpatialState {
  npcLocations: Record<string, string>;
  poiOccupants: Record<string, string>;
}
```

Missing keys mean:

- the NPC is not currently placed;
- the POI is currently empty.

### Field meaning

#### `npcLocations`

Fast lookup:

- `npcId -> poiId`

Used for:

- checking where an NPC currently is;
- preventing duplicate placement;
- quick quest and runtime checks.

#### `poiOccupants`

Fast lookup:

- `poiId -> npcId`

Used for:

- rendering populated POIs;
- finding the occupant of a POI;
- composing interaction UI.

---

## Candidate Set Resolution

The distribution system does not search NPCs by home cell.

For the current active cell, candidate NPC ids are collected from authored POI data:

- all `managerIds` on facilities in the cell;
- all `allowedNpcIds` on spots in the cell.

The union of those ids defines the NPC set that may appear in the current scene.

This keeps scene membership explicit and local to the authored POI graph.

---

## Distribution Lifecycle

NPC placement is scoped to the current time slot.

The important rule is stability:

- when a new slot starts, the current cell placement is cleared from both Spatial maps;
- during that slot, POI transitions resolve and cache placements;
- once a placement is written for the slot, it stays stable until the next slot change.

There is no continuous reroll while the player remains in the same time slot.

---

## Distribution Rules

### Step 1. Clear current cell placement

When the current time slot changes, remove the active cell placement from both maps:

- remove affected `npcLocations` entries;
- remove affected `poiOccupants` entries.

NPCs in that cell are then resolved again for the new slot.

### Step 2. Collect active NPCs

Build the candidate id set from:

- `facility.managerIds`
- `spot.allowedNpcIds`

Then read those NPCs and inspect the current slot.

NPCs with:

```text
action === 'hidden'
```

are excluded from placement.

### Step 3. Find valid spots for each NPC

An NPC is valid for a spot if all conditions pass:

1. `npc.id` is included in `spot.allowedNpcIds`
2. `npc.schedule[currentSlot].action === spot.spotPurpose`
3. the NPC has not already been placed elsewhere
4. the spot is currently empty

### Step 4. Choose one valid spot at random

If multiple valid spots exist, choose randomly among them.

For v1, random choice is enough because assignments are slot-scoped and cached.

### Step 5. Commit placement into Spatial

When a match is selected:

```ts
spatial.npcLocations[npc.id] = spotId;
spatial.poiOccupants[spotId] = npc.id;
```

This becomes the current runtime truth for the slot.

---

## Facility Open-State Check

Facilities use `managerIds`.

A facility is open if at least one manager is currently scheduled to:

```text
work
```

Pseudo-rule:

```text
facility is open
if any managerId has current schedule action === 'work'
```

This is a simple gameplay rule.
It does not try to simulate a full working day.

---

## Interaction Composition

When the player clicks a populated POI, the UI starts in POI service mode.

### POI service mode

These come from the POI template itself.

Examples:

- `trade`
- `leave`
- `rest`
- `wait`

If the POI currently has an occupant, POI mode may also expose `talk`.

`talk` is the gateway from slot interaction into NPC interaction.

### NPC service mode

NPC personal services are not merged into the slot service list.
They become available only after the player activates `talk`.

Examples:

- `flirt`
- `hire`
- `askRumors`

### Transition rule

When `talk` is selected:

1. read the occupant from `spatial.poiOccupants[poiId]`;
2. treat that NPC as the current interaction subject;
3. replace the visible POI service list with `npc.personalServiceIds`;
4. hide POI slot services while NPC mode is active.

Trade is not assumed to be an NPC personal service in v1.
If a spot exposes `trade`, that trade belongs to the spot service layer unless another rule is specified explicitly.

---

## Narrative And Image Context

When the player enters NPC interaction through `talk`, the occupant NPC id becomes the current interaction subject.

This single `npcId` is enough for:

- relation and affection resolution;
- narrative specialization;
- image specialization.

Because there is at most one occupant per POI, there is no ambiguity about which NPC supplies the context.

---

## v1 Scope

This version intentionally stays:

- simple;
- explicit;
- slot-scoped;
- non-simulative;
- easy to reason about.

It also intentionally keeps these limits:

- one NPC at most per POI;
- `allowedNpcIds` and `managerIds` are hand-authored;
- schedule stores activity type, not a destination;
- placement resets on slot change;
- no world simulation outside the active cell.

---

## Summary

This v1 system is built around three layers:

### POI

Static authored scene configuration.

### NPC

Static actor data with identity, schedule, affection, and personal services.

### Spatial

Slot-scoped runtime source of truth for current NPC placement in the active cell.

The gameplay loop is:

```text
enter a cell or start a new time slot
-> clear current slot placement for the active cell
-> resolve candidates from managerIds and allowedNpcIds
-> place visible NPCs into valid empty spots
-> store result in Spatial
-> click POI
-> show POI services and optional talk
-> if talk is chosen, switch to the occupant NPC service list
```
