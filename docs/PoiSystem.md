# POI System Design (v1)

## Purpose

This document describes the final v1 POI model.

POIs are template-driven runtime nodes attached to map cells. In v1 they control:

- hierarchy inside a cell;
- runtime creation from templates;
- discovery through exploration;
- revisit-based encounter spawning;
- local interaction services;
- narrative and image lookup context;
- static placement rules for NPC distribution.

Current NPC placement is not stored on POIs.
That runtime state lives in Spatial.

Related documents:

- [NpcSpatialSystem](./NpcSpatialSystem.md)
- [NarrativeSystem](./NarrativeSystem.md)
- [TradeSystem](./TradeSystem.md)
- [RegionParameters](./RegionParameters.md)

---

## Core Model

### POI node hierarchy

The runtime POI tree is built from nodes with these common fields:

- `id`
- `parentId`
- `childrenIds`
- `rootCellId`

`cell` POIs are the root map nodes.
All other POIs live under a cell, directly or indirectly.

Example hierarchy:

```text
cell
-> facility
   -> spot
-> encounter
```

### Runtime types

The type system supports these POI types:

- `cell`
- `encounter`
- `facility`
- `spot`
- `loot`
- `dungeon`
- `settlement`
- `base`
- `boss`
- `quest`

The active v1 gameplay flow relies mainly on:

- `cell`
- `encounter`
- `facility`
- `spot`

### Authored vs runtime responsibilities

POIs are responsible for:

- world and scene hierarchy;
- authored local services;
- exploration and discovery thresholds;
- encounter spawning and progression rules;
- narrative and image context;
- static NPC placement rules for facilities and spots.

POIs are not responsible for:

- current NPC ownership of a scene POI;
- current runtime occupancy;
- tracking where NPCs are right now.

That runtime placement belongs to Spatial.

---

## Detail Model

### Shared scene details

Scene-facing non-cell POIs use these concepts:

- `poiTemplateId` for template-driven content;
- `isDiscovered` and `explorationThreshold` for visibility;
- template `services` for local actions.

### Type-specific details

#### Encounter details

Encounter POIs may include:

- `faction`
- `level`
- `progress`
- `progressMax`
- `lifetimeDays`
- `combatUnits`
- `store`

Encounters continue to represent dynamic world content such as patrols, hostiles, and event nodes.

#### Facility details

Facilities add:

- `managerIds?: string[]`

These ids are used for facility open-state checks.
Facilities remain static scene containers and may expose local services such as `rest`.

#### Spot details

Spots add:

- `spotPurpose: 'work' | 'free_time'`
- `allowedNpcIds: string[]`

These fields define which NPCs may occupy the spot and for what kind of schedule action.
Each spot can contain at most one NPC in v1.

---

## Template Database

POI templates live in `POI_TEMPLATES_DB`.

Each template can define:

- `type`
- `details`
- `services`
- `triggers`
- `levels`

Simplified shape:

```ts
type PoiTemplate = {
  type: TemplatePoiType;
  details: Partial<TemplateDetailsFor<T>>;
  services?: InteractionService[];
  triggers?: PoiTemplateTriggers;
  levels?: Record<number, PoiTemplateLevel<T>>;
};
```

### Runtime detail resolution

Encounter details are resolved from layered template data:

```text
encounter details =
{ poiTemplateId, level }
+ detailsBase
+ template.details
+ level.details
+ detailsOverride
```

Facility and spot details use the same layered approach without encounter level logic:

```text
facility/spot details =
{ poiTemplateId }
+ detailsBase
+ template.details
+ detailsOverride
```

For scene POIs, these resolved details are authored scene configuration rather than runtime occupancy.

---

## Discovery And Revisit Flow

### Exploration and discovery

Cells still govern discovery.

When a cell is explored:

- the cell updates its exploration state;
- child POIs whose thresholds are satisfied become discovered;
- discovered scene POIs remain part of the authored structure whether they are occupied or empty.

Occupancy does not control whether a POI exists.

### Re-entering a cell

Cell revisit flow still handles encounter generation.

Current rules for that layer remain:

- only cells generate revisit content;
- revisit spawning is capped per cell;
- generated encounter seeds become new child POIs under the cell.

This encounter logic is separate from NPC scene placement.

---

## NPC-Aware Scene Semantics

The final v1 scene model uses three layers together:

- `POI` for static authored scene structure;
- `NPC` for actor identity, affection, schedule, and personal services;
- `Spatial` for current slot placement.

### Facility open-state

A facility is considered open if at least one `managerId` is scheduled to `work` in the current time slot.

This is a gameplay rule.
It is not a simulation of every intermediate action inside the facility.

### Spot occupancy

A spot is a static authored place that may or may not currently have an occupant.

The final rule set is:

- occupancy is resolved from Spatial;
- one NPC max per POI;
- an empty spot still exists and may still expose its local POI services.

---

## Interaction Flow And Services

### Starting an interaction

`startInteraction(...)` builds `currentInteraction` for the selected non-cell POI.

The final v1 flow is:

1. Read `poiId`, `poiTemplateId`, and local POI services.
2. Look up the optional occupant `npcId` from Spatial for the selected POI.
3. If occupied, expose `talk` as the gateway from POI mode to NPC mode.
4. Build the initial POI-mode service state.
5. When `talk` is chosen, resolve NPC-specific faction, affection, and personal services from the NPC layer.
6. Replace the visible POI service list with the occupant NPC service list.
7. Apply the regular interaction rules to whichever subject is currently active.
8. Apply force-tension behavior if tension is already above the threshold.

If the POI is empty, the interaction remains POI-only.

### Effective relation

When the active interaction subject is an NPC and relation is not provided directly, effective relation is computed from:

- faction reputation;
- personal affection;
- faction loyalty weights from `getLoyaltyProfile(...)`.

Formula:

```text
effectiveRelation =
  personalAffection * personalWeight
  + factionReputation * factionWeight
```

### Initial tension

When no stored memory is restored and no explicit value is passed in, initial tension is:

```text
initialTension = effectiveRelation + randomOffset
randomOffset in [-20..20]
```

### Interaction memory

Interaction memory is stored by the current subject:

- `poiId` in POI mode;
- `npcId` in NPC mode.

The stored snapshot keeps:

- `tension`
- `tradeAttempts`
- service execution history

When a player re-enters the same subject in the same general context, the interaction restores that tension and merges historical service usage back into the current service list.

### Force-tension behavior

If current tension becomes greater than `80`, the available services are replaced with a force preset.

Current behavior:

- if `attack` is not available, the interaction becomes `forceLeave` with only `leave`;
- otherwise the system randomly chooses either `forceAttack` or `forceRetreat`;
- `forceAttack` exposes only `attack`;
- `forceRetreat` exposes `attack` and `retreat`.

The forced transition is also logged into the interaction log.

### Service resolution order

POI services and NPC personal services use the same interaction resolution pipeline, but they are shown in different interaction modes.

Resolution order for a service attempt:

1. no rule at all -> auto-success;
2. insufficient money for `cost` -> fail;
3. `autoSuccessRelation` met -> auto-success;
4. `checkStat` present -> perform stat roll;
5. `difficulty` without `checkStat` -> pure random roll;
6. `autoSuccessRelation` without other checks -> relation-derived chance;
7. otherwise -> auto-success.

Supported effect descriptors include:

- `modifySkill`
- `modifyMainStat`
- `modifyTargetAffection`
- `modifyFactionReputation`
- `modifyTension`
- `modifyPartyStamina`

### Interaction result in UI

Because v1 allows only one NPC per POI, there is no extra target-selection layer for personal services.

The clicked POI moves between two UI states:

- POI mode: local POI services plus optional `talk` when the POI has an occupant;
- NPC mode: occupant NPC personal services only, while POI slot services are hidden.

---

## Narrative And Image Resolution

POI scenes hook into both narrative and image resolution through:

- `poiTemplateId`
- `poiId`
- optional occupant `npcId`

When a POI is occupied, that single `npcId` becomes the subject for specialization.

Narrative and image resolution share the same priority-key chain described in [NarrativeSystem](./NarrativeSystem.md).

The `defaultOwner` key names are kept as the canonical generic occupied-NPC fallback keys in v1 authoring.
They do not imply that the POI stores runtime ownership.

If a POI is empty, resolvers fall back to POI-specific and default variants.

---

## Day-Pass And Time-Slot Behavior

### Day-pass pipeline

POI day-pass logic continues to handle:

- encounter lifetime progression;
- template trigger collection;
- cell parameter changes.

### Slot-scoped scene population

NPC placement is separate from day-pass progression.

The final v1 rule is:

- when a new time slot starts, Spatial clears current placement for the active cell;
- as the player enters or traverses POIs during that slot, placements are resolved and cached;
- once written for the slot, assignments stay stable until the next slot change.

This avoids continuous rerolling while the player remains in the same time period.

---

## v1 Scope

The POI system intentionally keeps these boundaries in v1:

- one NPC at most per POI;
- `allowedNpcIds` and `managerIds` are hand-authored;
- NPC schedule stores activity category, not an exact destination;
- facility open-state depends only on manager schedule;
- encounter generation and NPC scene placement are separate systems;
- this is not a full world simulation.

---

## Summary

Final v1 POI behavior is built around:

- template-driven world and scene nodes;
- cell-scoped discovery;
- revisit-based encounter spawning;
- local interaction services;
- slot-scoped NPC placement through Spatial;
- shared narrative and image specialization by `poiTemplateId`, `poiId`, and optional occupant `npcId`.

In the final v1 model, POIs remain the authored bridge between cell state, interaction flow, and content authoring, while Spatial becomes the runtime source of truth for who is currently present in the scene.
