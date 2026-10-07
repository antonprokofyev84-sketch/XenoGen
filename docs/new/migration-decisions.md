# Migration Decisions

## Scope

- `docs/new` is the source of truth for this migration.
- Persistence and save/load do not enter this migration. No legacy-save migration is required.
- Combat is outside this migration and will be rewritten separately. The new Action runtime does not implement `combat` transition yet.
- Trade is outside this migration and will be rewritten separately. The generic `trade` transition only opens the existing modal; it does not change stock, inventory ownership, pricing, regional generation, or economy rules.
- `forceExit` is a system item in the single pending interaction-event queue, not an authored Interceptor definition. After an approved trigger, it replaces the ordinary pending authored-Interceptor queue but does not interrupt the current internal Frame.
- The system queue item exists only in slot/NPC context. It has no authoring `conditions`, `appearanceChance`, or execution limits and resolves the reserved Frame `<templateId>/<slotId>:forceExit`.
- If no force-exit Frame exists, the system exits quietly from the NPC context to its current POI. POI-context force exit is not part of this migration.
- A scheduled force exit is idempotent and remains scheduled through time-slot refreshes until it runs. Leaving the current context, removing its POI, or invalidating its slot/NPC context clears it.
- `modifyTension` is the only approved v1 effect that mutates tension and can produce a threshold crossing. Runtime checks the threshold after daily tension is initialized/restored on entry and after the complete Action/Interceptor result containing tension effects has been applied; other future trigger types remain separate interaction-policy decisions.

## POI And Occupancy

- Actual slot occupancy is a lazy local simulation: only a POI entered by the player is populated.
- When a POI is first entered in a time slot, its slot occupants are resolved and cached. Re-entry in the same time slot uses the cache; occupants do not reroll.
- POIs never visited in that time slot do not receive actual slot occupants and do not perform occupancy chance rolls.
- NPC `baseSchedule` contains `work`; it says when the NPC works, while candidate/assignment membership in a work slot says where. Global resolution requires both the current `work` state and an eligible slot in an open POI. Before that POI is visited, the NPC is already excluded from `freeTime` and `home`, so the workplace effectively reserves them; actual slot choice, chance and occupancy cache remain lazy. If no eligible open workplace produces occupancy, the NPC stays unplaced rather than falling back to another schedule group.
- A future root-cell occupancy scope remains possible, but is not part of the current implementation.
- `candidateNpcIds` is an immutable template pool of NPCs that may occupy a slot automatically.
- `RuntimeSlotAssignment` is a separate persistent map keyed by `poiId + slotId`. Its `assignedNpcId` is an explicit player assignment and never rewrites `candidateNpcIds`.
- An NPC has at most one job. Static `candidateNpcIds` may reference an NPC in at most one `work` slot. A runtime work assignment supersedes that static work-slot membership for resolved schedule and occupancy, allowing reassignment to a built room without a second job.
- An assignment is exclusive: a compatible and free assigned NPC occupies the slot without a `chance` roll. If the assigned NPC is unavailable, incompatible with the resolved schedule, or occupies another slot, this slot remains empty and does not fall back to template candidates.
- Occupancy remains a separate transient time-slot cache of actual occupants.

## World Time

For every crossed calendar-day boundary:

1. Run POI day effects and advance all world-owned day counters registered for `onDayEnd`, including POI lifetime, cell exploration and `entryDisabledDaysLeft`. Each counter keeps its own zero-state rule; `entryDisabledDaysLeft` is removed when it reaches zero.
2. Run quest timers and apply their collected effects.
3. Perform the physical removal sweep for all `pendingRemoval` POIs.
4. Clear daily Action and Interceptor memory.

After reaching the final time, resolve final-time-slot occupancy once, validate the current interaction context, and create its new Interceptor queue. Intermediate time slots do not create queues.

## Runtime And Content

- The first effect catalogue is closed: approved quest effects; structural `markCurrentPoiForRemoval`, `changeRegionParameter`, `disablePoiEntryForDays`, `setPoiEntryDisabled`; `modifyTension`; and protagonist-inventory rewards `addMoney`, `addItem`, `removeItem`. Every descriptor uses `type` as its discriminator. No other social, stat, skill, reputation, arbitrary-target inventory, or additional effects are added without a concrete approved content scenario.
- Ordinary parent/child POI navigation is a runtime-derived option. Author Actions are used only when navigation needs its own scene, checks, costs, or effects.
- Existing POI/services/narratives/quests are disposable technical content and are not migrated.
- The migration includes a purpose-built technical fixture set. It uses neutral content to exercise every approved runtime contract without defining gameplay narrative, balance, or production quests.

## Presentation

- The first migration includes complete Frame presentation.
- For `npcDisplay: 'always'`, the context NPC stays on the right. A different active speaker appears temporarily on the left. When the context NPC speaks, it stays on the right and is visually highlighted.
- NPC visuals use Vite `import.meta.glob` and the baseline path convention `src/assets/npcs/<npcId>/default.webp`.
- Interaction log events snapshot only resolved narrative blocks. They do not snapshot the background, visual variant, overlay layout, role, or display name.
- Switching between a POI root and its slot/NPC context starts a new interaction log but does not reset the current background. The newly opened root Frame applies its own background when present and otherwise inherits the current one. Travel to another POI or ending the interaction resets the background before the first Frame of the new interaction.

## Engineering

- Add Vitest in this migration for deterministic domain and orchestration tests.
- Keep TypeScript types flat under `src/types`; add new domain files alongside existing files rather than creating an interaction subdirectory.

## Resolved Follow-up Decisions

These resolve open points raised during design review. They refine the sections above and the initial-data documents.

### Save / Load

- Save/load is out of scope for this and the foreseeable migration. There is no in-conversation save.
- `interaction-runtime-state-design.md` section 8 ("Save и восстановление") is deferred. Its rules do not constrain the runtime; the state is not required to be serialisable in this migration.

### Protagonist stamina

- `cost.stamina` on an Action is the protagonist's personal resource.

### Localisation seam

- v1 content stores final display text inline (labels and narrative strings), so a quest reads as a single self-contained definition.
- A single `LocalizedText` alias (today = string) and a single `resolveText()` seam are introduced from the start. Narrative already resolves `{$npc}` once at log-event creation; the same seam is added for `label`.
- Later localisation widens `LocalizedText` to `string | Partial<Record<LocaleCode, string>>`, keeping text co-located in the same file (no external key catalog), or an extraction script lifts the strings. Either path is a localised change, not a project-wide rewrite.

### Conditions default to the current subject

- `affection` and `reputation` conditions/requirements default to the current interaction subject when no explicit id is given:
  - `affection` → the current NPC.
  - `reputation` → the faction of the current subject: the current NPC's faction, falling back to the current POI's faction. It tests the player's standing with that faction; the protagonist has no faction of their own to test.
- An explicit `npcId` / `factionId` overrides the default and tests that specific target.
- The default applies only to subject-bearing condition types. `stat`, `skill`, `item`, `defeated`, `questVar`, `questStatus` have no "current" subject.
- An unresolvable current subject is an authoring error reported by the validator — never a silent `false`.
- This lets a reusable personal Action gate on the current NPC without approving relation-changing effects. Such effects remain outside the first catalogue until a concrete scenario is accepted.

### Action read-context (facade) and region checks

- Number functions receive a curated, read-only facade (current POI region levels, current NPC affection/relation, tension, quest vars), not the raw `StoreState`. This decouples content from slice shape.
- Common region gating uses a declarative condition (e.g. `{ type: 'regionLevel', param, min/max/exact }`) resolved through the canonical `resolvePoiRegionLevels` of the current POI, so most checks need no function.
- The final facade shape is settled when the runtime is implemented; content must not reach into arbitrary slices.

### Initial tension baseline

- The existing formula remains the baseline: `factionWeight = 1 - personalWeight`, then `effectiveRelation = personalAffection * personalWeight + factionReputation * factionWeight`; a single integer random offset in `[-20, 20]` is applied afterward.
- The old implementation used `effectiveRelation + randomOffset`, which inverted the intended meaning by making good relations increase tension. The corrected baseline is `clamp(-effectiveRelation + randomOffset, 0, 100)`.
- Temporary call-site placeholders from the current `startInteractionDraft` (`neutral` faction and zero affection) are not part of the formula. The new runtime supplies the actual NPC faction, affection and faction reputation.
- The roll is performed only when the NPC gets its first daily tension value. The result is stored in that NPC's daily subject memory and reused for the rest of the day.
- The concrete `forceExit` threshold remains a separate balance decision.

### Validation

- A consolidated development-time validator owns all cross-reference and authoring-invariant checks previously scattered across the initial-data documents. Its contract is in `validation-contract.md`.
- The first validator does not build a reachability graph from roots through Frames and Actions. Context-only constructs such as `$npc` and `npcDisplay: 'always'` are enforced by runtime context guards when entered; graph validation can be added later.
