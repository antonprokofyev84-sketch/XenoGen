# Migration Decisions

## Scope

- `docs/new` is the source of truth for this migration.
- Persistence and save/load do not enter this migration. No legacy-save migration is required.
- Combat is outside this migration and will be rewritten separately. The new Action runtime does not implement `combat` transition yet.
- Trade is outside this migration and will be rewritten separately. The generic `trade` transition only opens the existing modal; it does not change stock, inventory ownership, pricing, regional generation, or economy rules.
- `forceExit` is a system runtime-interceptor. After an approved trigger, it replaces the ordinary pending Interceptor queue but does not interrupt the current internal Frame.
- The system queue item has no authoring `conditions`, `appearanceChance`, or execution limits. It resolves a context Frame by the reserved IDs `<templateId>:forceExit` and `<templateId>/<slotId>:forceExit`.
- If no force-exit Frame exists, the system exits quietly: slot/NPC context returns to its current POI, and POI context moves to its parent POI.
- A scheduled force exit is idempotent and remains scheduled through time-slot refreshes until it runs. Leaving the current context, removing its POI, or invalidating its slot/NPC context clears it.
- `modifyTension` is included only as the narrow approved trigger for this system behavior. The tension threshold and other future force-exit triggers remain separate interaction-policy decisions.
- Expedition points, negative fatigue, and other ideas from `ideas.md` remain out of scope.

## POI And Occupancy

- NPC occupancy is a lazy local simulation: only a POI entered by the player is populated.
- When a POI is first entered in a time slot, its slot occupants are resolved and cached. Re-entry in the same time slot uses the cache; occupants do not reroll.
- POIs never visited in that time slot are not simulated.
- A future root-cell occupancy scope remains possible, but is not part of the current implementation.
- `candidateNpcIds` is an immutable template pool of NPCs that may occupy a slot automatically.
- `RuntimeSlotAssignment` is a separate persistent map keyed by `poiId + slotId`. Its `assignedNpcId` is an explicit player assignment and never rewrites `candidateNpcIds`.
- An assignment is exclusive: a compatible and free assigned NPC occupies the slot without a `chance` roll. If the assigned NPC is unavailable, incompatible with the resolved schedule, or occupies another slot, this slot remains empty and does not fall back to template candidates.
- Occupancy remains a separate transient time-slot cache of actual occupants.

## World Time

For every crossed calendar-day boundary:

1. Run POI day effects and lifetime changes.
2. Run quest timers and apply their collected effects.
3. Perform the physical removal sweep for all `pendingRemoval` POIs.
4. Clear daily Action and Interceptor memory.

After reaching the final time, resolve final-time-slot occupancy once, validate the current interaction context, and create its new Interceptor queue. Intermediate time slots do not create queues.

## Runtime And Content

- The first effect catalogue is limited to structural effects, approved quest effects, and the narrow `modifyTension` effect needed to schedule `forceExit`. No other social, stat, skill, reputation, or additional effects are added without a concrete approved content scenario.
- Ordinary parent/child POI navigation is a runtime-derived option. Author Actions are used only when navigation needs its own scene, checks, costs, or effects.
- Existing POI/services/narratives/quests are disposable technical content and are not migrated.
- The migration includes a purpose-built technical fixture set. It uses neutral content to exercise every approved runtime contract without defining gameplay narrative, balance, or production quests.

## Presentation

- The first migration includes complete Frame presentation.
- For `npcDisplay: 'always'`, the context NPC stays on the right. A different active speaker appears temporarily on the left. When the context NPC speaks, it stays on the right and is visually highlighted.
- NPC visuals use Vite `import.meta.glob` and the baseline path convention `src/assets/npcs/<npcId>/default.webp`.
- Interaction log events snapshot only resolved narrative blocks. They do not snapshot the background, visual variant, overlay layout, role, or display name.

## Engineering

- Add Vitest in this migration for deterministic domain and orchestration tests.
- Keep TypeScript types flat under `src/types`; add new domain files alongside existing files rather than creating an interaction subdirectory.
