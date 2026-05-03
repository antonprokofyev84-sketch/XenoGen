# Narrative System Design (v1)

## Purpose

The narrative system handles:

- enter descriptions;
- action result descriptions;
- optional dialogue-like lines inside narrative variants.

Narrative resolution is based on `poiTemplateId`.
That template id is the main narrative group.
Specific variants are resolved inside the template group by priority keys.

Related documents:

- [PoiSystem](./PoiSystem.md)
- [NpcSpatialSystem](./NpcSpatialSystem.md)
- [TradeSystem](./TradeSystem.md)

---

## Narrative Subject Model

In final v1 narrative resolution, the current subject comes from the selected POI and its optional occupant.

- `poiTemplateId` identifies the narrative group;
- `poiId` identifies the specific place;
- optional `npcId` identifies the current occupant and interaction subject.

Because v1 allows only one NPC per POI, a single `npcId` is enough for subject-specific narrative.

---

## Narrative Key Priority

Priority from high to low:

1. `{npcId}_{poiId}`
   Specific NPC in a specific place.

2. `{npcId}`
   Specific NPC at any POI of this template type.

3. `defaultOwner_{poiId}`
   Generic occupied-NPC fallback in a specific place.

4. `defaultOwner`
   Generic occupied-NPC fallback for this template type.

5. `{poiId}`
   Specific place fallback without a subject-specific variant.

6. `default`
   Final template fallback.

The `defaultOwner` key names remain the canonical authoring keys in v1.
They mean generic occupied-NPC fallback, not literal runtime ownership stored on the POI.

---

## Data Shape

Structure:

```text
POI_NARRATIVES
-> poiTemplateId
-> action
-> outcome
-> narrativeKey
-> narrative variants
```

Example:

```ts
export const POI_NARRATIVES = {
  tavern_bartender_spot: {
    enter: {
      success: {
        npc_bob_tavern_bartender_spot: [
          'The tavern smells of stale beer and wet coats. Bob looks up from the counter.',
          [
            'You step up to the bar.',
            { speaker: 'Bob', text: 'Back again?' },
            'He keeps polishing the same glass while waiting for your answer.',
          ],
        ],

        npc_bob: ['Bob stands behind the counter and studies you for a moment.'],

        defaultOwner_tavern_bartender_spot: [
          'A bartender waits behind the counter, already judging whether you are worth the trouble.',
        ],

        defaultOwner: ['A bartender glances up as you approach the bar.'],

        tavern_bartender_spot: ['The counter is scratched, sticky, and familiar.'],

        default: ['You approach the bar.'],
      },
    },

    trade: {
      success: {
        npc_bob_tavern_bartender_spot: [
          ['Bob lays the goods out one by one.', { speaker: 'Bob', text: 'Choose fast.' }],
        ],

        defaultOwner: ['The bartender quotes a price and waits.'],

        default: ['The deal goes through without much talk.'],
      },

      fail: {
        npc_bob_tavern_bartender_spot: [
          ['Bob does not even reach for the goods.', { speaker: 'Bob', text: 'Not for you.' }],
        ],

        defaultOwner: ['The bartender refuses the deal.'],

        default: ['Nothing comes of it.'],
      },
    },
  },
};
```

---

## Narrative Variant Format

The outer array stores random variants.

Each chosen variant can be:

### A simple text variant

```ts
'You approach the bar.';
```

### A composite variant

```ts
[
  'You step up to the counter.',
  { speaker: 'Bob', text: 'Back again?' },
  'The room gets quieter for a second.',
];
```

Types:

```ts
type DialogueLine = {
  speaker: string;
  text: string;
};

type NarrativeBlock = string | DialogueLine;

type NarrativeVariant = string | NarrativeBlock[];

type NarrativeVariants = NarrativeVariant[];
```

---

## Meaning Of Arrays

Important rule:

- outer array = random variants;
- inner array = ordered narrative blocks inside one chosen variant.

Example:

```ts
npc_bob_tavern_bartender_spot: [
  'Simple variant one.',

  [
    'Composite variant start.',
    { speaker: 'Bob', text: 'Dialogue line.' },
    'Composite variant end.',
  ],
];
```

This means:

- choose either the simple variant or the composite variant;
- if the composite variant is chosen, render all blocks in order.

---

## Resolver Algorithm

Input:

- `poiTemplateId`
- `action`
- `outcome`
- `npcId` optional
- `poiId`
- `hasNpcSubject`

Step 1:

Open:

```text
POI_NARRATIVES[poiTemplateId][action][outcome]
```

Step 2:

Build priority keys.

If `npcId` exists:

1. `${npcId}_${poiId}`
2. `${npcId}`

If the POI currently has an NPC subject:

3. `defaultOwner_${poiId}`
4. `defaultOwner`

Always:

5. `${poiId}`
6. `default`

Step 3:

Find the first existing key.

Step 4:

Pick one random variant from that key.

Step 5:

Normalize result:

- if the variant is a string -> `[variant]`
- if the variant is an array -> `variant`

Final output is always:

```ts
NarrativeBlock[]
```

---

## Mood Support

Mood may be added only where needed.

Simple format:

```ts
npc_bob: ['Text variant.'];
```

Mood-aware format:

```ts
npc_bob: {
  hostile: ['Hostile text variant.'],
  friendly: ['Friendly text variant.'],
  default: ['Default text variant.'],
}
```

Resolver rule:

- try the selected mood first;
- fall back to `default`.

This stays optional per key.

---

## Rules

- Base grouping is always `poiTemplateId`.
- `default` should exist for every important action and outcome.
- Use NPC-specific keys only when needed.
- Keep dialogue as ordered blocks inside one narrative variant.
- Keep outer arrays as random variants.
- Keep inner arrays as ordered blocks.
- Use the same subject logic for image resolution.
- Read `npcId` from Spatial occupancy, not from POI runtime ownership.

---

## Summary

Narrative is resolved as:

```text
poiTemplateId
-> action
-> outcome
-> best available narrative key
-> random variant
-> normalized blocks
```

Key priority:

1. `{npcId}_{poiId}`
2. `{npcId}`
3. `defaultOwner_{poiId}`
4. `defaultOwner`
5. `{poiId}`
6. `default`

In final v1, `npcId` means the current occupant subject of the POI.
