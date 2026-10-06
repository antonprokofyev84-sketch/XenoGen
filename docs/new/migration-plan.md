# План масштабной миграции

## Статус и границы

Этот план основан на документах из `docs/new`. Они являются целевым контрактом.

Документы вне этой папки используются только как описание уже реализованного или исторического состояния. В частности, `docs/tmp.md`, `docs/PoiSystem.md`, `docs/NpcSpatialSystem.md` и текущая реализация универсальных POI не задают цель этой миграции, если противоречат `docs/new`.

`ideas.md` и `TradeSystem.md` не являются финальной спецификацией механик. В план не включается реализация их баланса, формул или новых ресурсов без отдельного утверждения.

Цель миграции: заменить существующую POI/services-модель на initial data для cells, POI templates, NPC, Frames, Actions, Interceptors и статических quests, а также создать runtime, который исполняет эти контракты.

## Оценка

Миграция реализуема, но это не продолжение старой Universal POI Migration, а её частичная отмена и замена. Наиболее рискованные области -- порядок мирового времени, POI removal, runtime Actions/Interceptors и смена NPC/slot-контекста.

Текущий проект даёт полезную основу:

- Zustand + Immer store и атомарный `world.actions.travelToPoi`;
- `advanceTimeDraft` с обработкой переходов времени;
- factory/initialization POI, discovery, удаление зависимостей и occupancy;
- stat-roll service, inventory, faction, party и combat state;
- экран `PoiView`, interaction log и trade modal.

Но целевые подсистемы ещё отсутствуют:

- нет Frame, Action и Interceptor registries;
- нет нового Action executor и resolver доступных вариантов;
- нет quest slice и runtime статических квестов;
- нет slot-based occupancy;
- нет persistence/save implementation;
- нет тестового раннера или существующих unit/e2e tests.

Текущая production-сборка проходит: `npm run build`.

## Карта замены контрактов

| Текущее состояние                                           | Целевой контракт                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PoiNode.type`, включая sentinel `cell`                     | Cell определяется `parentId === null`; обычный POI хранит `templateId`                     |
| `nestedPoiIds`, `localSpotIds`, `isLocalSpot`               | Только `childPoiIds`; local spots удаляются, NPC живут в slots template                    |
| `INITIAL_POI` с cells и POI в одном массиве                 | `INITIAL_CELLS` и `INITIAL_POIS_BY_CELL`                                                   |
| `POI_TEMPLATES_DB` с `services`, `triggers`, `npcPlacement` | `POI_TEMPLATES` с schedule, action/interceptor IDs, slots, level modifiers и `onDayPass`   |
| `Infinity` для постоянных сроков                            | `null` в `RemainingDays`; initial lifetime допускает только `null` или положительное целое |
| raw region overrides/modifiers в details POI                | template-level overrides/modifiers уровней `0..9`; raw значения остаются только у cell     |
| `InteractionService`, `performService`, `services[]`        | registries Actions/Frames, `performAction`, derived UI options                             |
| POI narrative resolver по action/outcome                    | narrative, background и display mode у Frame; narrative результата у Action/Interceptor    |
| POI-local occupancy `poiId -> npcId`                        | occupancy `poiId -> slotId -> npcId`, разрешаемая из slots                                 |
| старые quest definitions, services и narratives             | static Quest definitions, Quest runtime и Action/Interceptor indexes                       |

## Статус открытых вопросов

Список сверён с `migration-decisions.md` (decision log из фазы 0) и последующими review-решениями. Часть пунктов закрыта; реализация по-прежнему не закрывает оставшиеся открытые пункты по догадке.

### Решено (`migration-decisions.md`)

1. **Persistence / save/load.** Вне скоупа. In-conversation save в v1 нет; состояние не обязано быть сериализуемым. `interaction-runtime-state-design (3).md` §8 помечен отложенным. Заявлять совместимость сохранений нельзя, пока persistence не спроектирован отдельно.
2. **Trade transition.** Генерация stock и экономика вне скоупа. `trade` только открывает существующую модалку; источник inventory, владелец container, контекст и regional generation переписываются отдельно.
3. **Граница occupancy.** Ленивая локальная симуляция только для входимого POI: occupants разрешаются и кешируются при первом входе в time slot, повторный вход в тот же slot их не перебрасывает, невходимые POI не симулируются. Root-cell scope отложен.
4. **Политика non-quest Effects.** Первый каталог — только структурные эффекты + утверждённые quest-эффекты + узкий `modifyTension` для `forceExit`. Прочие добавляются лишь под конкретный утверждённый сценарий; осталось перечислить обязательные структурные эффекты.
5. **Presentation.** `npcDisplay: 'always'` — контекст-NPC справа, активный speaker временно слева, говорящий контекст-NPC остаётся справа и подсвечивается. Baseline-визуалы через `import.meta.glob`, путь `src/assets/npcs/<npcId>/default.webp`. Log event снимает только resolved narrative blocks. Закрытый POI — disabled-переход с пометкой «Закрыто».
6. **Test runner.** Vitest добавляется в этой миграции для детерминированных domain/orchestration тестов. Вариант «только typecheck/build» отклонён.
7. **Размещение типов.** Плоско в `src/types`, рядом с существующими файлами; отдельная interaction-поддиректория не создаётся.
8. **Порядок конца дня.** Задан в `migration-decisions.md` (World Time): POI day-effects+lifetime → quest-таймеры+эффекты → removal sweep → очистка дневной памяти; затем однократный финальный occupancy, валидация контекста и новая interceptor-очередь.

### Дополнительно решено в review

9. **Локализация.** v1 хранит финальный текст инлайн (label и narrative) — квест читается целиком в одном месте. Вводится alias `LocalizedText` (сегодня `= string`) и единый `resolveText()` с самого начала; позже расширяется до `string | Partial<Record<LocaleCode, string>>` без переписывания контента.
10. **Read-context Action.** Числовые функции получают курируемый read-only facade (region levels текущего POI, affection/relation текущего NPC, tension, quest vars), а не сырой `StoreState`. Частые региональные проверки — декларативным condition `regionLevel` через `resolvePoiRegionLevels` текущего POI. `cost.stamina` — личный ресурс протагониста; партийный пул меняет только `modifyPartyStamina`.
11. **Conditions «текущий субъект».** `affection` и `reputation` без явного id адресуют текущий субъект: `affection` → текущий NPC; `reputation` → фракция текущего NPC, затем POI. Явный `npcId`/`factionId` переопределяет. Неразрешимый субъект — ошибка валидатора, а не `false`.
12. **Валидатор.** Консолидированный dev-time контракт — `validation-contract.md`: ссылочная целостность (`actionIds`/`frameId`/`candidateNpcIds`/`templateId`/quest-таргеты/`itemId`/`factionId`/`enemyTypeId`), «один lifecycle-эффект на квест в блоке», `$npc` и `npcDisplay: 'always'` только при наличии `npcId`, разрешимость current-subject условий и прочие инварианты.

### Остаётся открытым

13. **Combat transition.** `combat` out of scope; context возврата, выбор post-combat Frame и передача loot/result проектируются при отдельном переписывании боя.
14. **Числовой порог tension (balance).** Модель tension и forceExit зафиксирована в `tension-force-exit-and-poi-entry.md`: дневной tension принадлежит NPC (хранится в его `SubjectDailyInteractionMemory`), резолвится при первом взаимодействии за день из effective relation + случайного отклонения; forceExit срабатывает при достижении порога и **повторяется при каждом входе** к этому NPC в тот же день, пока значение на пороге или выше. Открытым остаётся только конкретное числовое значение порога (не брать `80` по умолчанию) и возможные дополнительные triggers.
15. **Технические fixtures.** Минимальный нейтральный набор, покрывающий все утверждённые контракты, определяется до UI/runtime-интеграции (детализирован в Фазе 1.1).
16. **Expedition points / `ideas.md`.** `expeditionPoints`, отрицательная усталость и новая travel-формула вне скоупа без отдельного утверждения.

Открытые пункты (13–16) не закрываются реализацией по догадке: решение сначала фиксируется в `migration-decisions.md`.

## Фаза 0. Зафиксировать миграционный baseline

1. Создать краткий migration decision log рядом с этим планом.
2. Зафиксировать, что `docs/new` имеет приоритет над старой документацией и что compatibility layer не является целью по умолчанию.
3. Инвентаризировать текущие content-записи только для последующего удаления: cells, POIs, templates, local spots, NPCs, services, narrative keys и quest definitions.
4. Спроектировать новый нейтральный technical fixture set. Он должен быть единственным initial content, необходимым для проверки миграции; старый content не получает mapping и не переносится.
5. Для открытых пунктов раздела "Статус открытых вопросов" (13–16) зафиксировать решение в `migration-decisions.md` до фазы, которая от него зависит.
6. Сохранить текущий `npm run build` как baseline и добавить Vitest (решено в migration-decisions.md) с минимальным smoke test для инициализации нового мира.

Критерий завершения: утверждён scope, определён technical fixture set и закрыты решения, необходимые для первой реализуемой вертикали.

## Фаза 1. Общие типы и immutable registries

1. Ввести единые aliases для `CellId`, `PoiId`, `PoiTemplateId`, `SlotId`, `NpcId`, `FrameId`, `ActionId`, `InterceptorId`, `QuestId` и `QuestStageId`.
2. Ввести общие `RemainingDays`, `RegionParameterKey`, `RegionParameters`, `RegionLevels`, `ActionNumber`, `ExecutionLimit` и числовые comparison types согласно новым документам.
3. Ввести immutable types и registries `INITIAL_CELLS`, `INITIAL_POIS_BY_CELL`, `POI_TEMPLATES`, `INITIAL_NPCS`, `INITIAL_FRAMES`, `INITIAL_ACTIONS`, `INITIAL_INTERCEPTORS` и `INITIAL_QUESTS`.
4. Описать `NarrativeBlock`, `$npc`, `NpcDisplayMode`, Action/Interceptor result unions, checks, transitions и conditions ровно в пределах нового контракта. Ввести alias `LocalizedText` (= `string`) и единый `resolveText()` seam для label и narrative с самого начала. `ActionContext` для числовых функций — курируемый read-only facade (region levels текущего POI, affection/relation текущего NPC, tension, quest vars), а не сырой `StoreState`.
5. Перенести в общий condition union существующие виды `stat`, `skill`, `item`, `defeated`, `affection`, `reputation` и добавить утверждённые `questVar`, `questStatus` и декларативный `regionLevel`. Для `affection` и `reputation` без явного id действует дефолт «текущий субъект» (NPC; фракция NPC → POI); явный id переопределяет.
6. Ввести development validation по консолидированному контракту `validation-contract.md`. Помимо grammar Frame IDs, отсутствия `/` и `:` в запрещённых сегментах, полных schedules, chance `0..1`, корректных remaining days, целых region levels и отсутствия duplicate Action/Interceptor IDs обязательна ссылочная целостность: все `actionIds`/`frameId`/`candidateNpcIds`/`templateId`/quest-таргеты/`itemId`/`factionId`/`enemyTypeId` разрешаются в своих реестрах; «один lifecycle-эффект на квест в блоке»; `$npc` и `npcDisplay: 'always'` только при наличии `npcId`; разрешимость current-subject условий.
7. Разместить новые type/data-модули плоско в `src/types` рядом с существующими файлами (решено в `migration-decisions.md`); отдельная interaction-поддиректория не создаётся. Registry paths для initial data заданы доками.

Критерий завершения: новый content может компилироваться в isolation; definitions не зависят от Zustand runtime и не мутируются.

## Фаза 1.1. Technical fixture content

1. Создать отдельные initial definitions, явно предназначенные для технической проверки, а не для игрового контента.
2. Добавить минимальную карту cells и дерево POI, которое покрывает: discovered и hidden child POI, открытый и закрытый POI, parent/child navigation, временный POI с `lifetimeDaysLeft` и POI с `onDayPass`.
3. Добавить POI template со slots `work`, `freeTime` и `home`, несколькими `candidateNpcIds` и `chance`, а также runtime assignment scenario. Проверить порядок разрешения, occupancy cache, закрытый рабочий POI, assignment без chance и пустой slot при недоступном assigned NPC.
4. Добавить Frames, которые покрывают root POI, root slot, внутренний Frame, `background`, `npcDisplay: 'none' | 'speaker' | 'always'`, return to root и current-POI context return.
5. Добавить Actions, покрывающие direct result, stat/skill/chance checks, success/fail result, weighted outcome, conditions, requirements, cost, daily appearance chance, `perDay`, `total`, frame transition, parent/child POI transition, existing `trade` modal transition и `modifyTension`, пересекающий fixture threshold.
6. Добавить Interceptors для silent effect, Frame-opening event, priority ordering, repeat condition, `appearanceChance`, execution limits и system `forceExit` в POI- и slot-контекстах.
7. Добавить статические fixture quests для `initialStage`, stage transition, quest vars, quest status condition, target indexes, stage/quest timers and terminal state. Их тексты должны быть нейтральными и не задавать production narrative.
8. Не добавлять fixture combat transition, social effects помимо `modifyTension` для `forceExit`, regional trade generation или mechanics из `ideas.md`: они находятся вне утверждённого scope.

Критерий завершения: каждый утверждённый runtime contract имеет как минимум один initial fixture и один deterministic Vitest scenario.

## Фаза 2. Cell, POI и region model

1. Заменить POI graph types: `CellNode` имеет `parentId: null` и `childPoiIds`; `NonCellPoiNode` имеет обязательный `parentId: string`, `templateId`, `rootCellId`, `childPoiIds`, normalized details, copied schedule, `pendingRemoval`, а так же флаги доступа 'isEntryDisabled' и 'entryDisabledDaysLeft' (isEntryDisabled и entryDisabledDaysLeft допускают initial значения) - в runtime.
2. Удалить из активной модели `type`, `isLocalSpot`, `nestedPoiIds`, `localSpotIds`, `PoiType`, local-spot selectors и navigation semantics, связанные с ними.
3. Создать `createCellId` и `parseCellId`; строить cell runtime coordinates из ID, а не хранить их в authoring data.
4. Разделить current `initialPoi.ts` на `src/data/initial/cells.ts` и `src/data/initial/pois.ts`; cells не должны содержать derived topology or coordinates.
5. Заменить `INITIAL_POI` initializer двухпроходной инициализацией: создать все cells, создать все POI из `INITIAL_POIS_BY_CELL`, затем связать каждого POI только с непосредственным parent через `childPoiIds`.
6. Нормализовать cell и POI details один раз в factory. Использовать `null`, а не `Infinity`, для постоянных `explorationDaysLeft` и `lifetimeDaysLeft`.
7. Перенести mechanics из `poi.templates.ts` в новый `POI_TEMPLATES`: instance details остаются в placement, shared schedule/actions/interceptors/slots/region rules/day effects -- в template.
8. Заменить текущий raw region resolver на единственный `resolvePoiRegionLevels`: raw `0..999` cell values -> `Math.floor(raw / 100)` -> template override либо modifier -> clamp `0..9`.
9. Не переносить parent-chain inheritance, region spread и economy/enemy scaling: они явно отложены.

Критерий завершения: новая игра строит корректное дерево непосредственных `childPoiIds`, coordinates cells и normalized details без старых полей.

## Фаза 3. POI lifecycle, exploration и day-end

1. Переписать discovery на обход `childPoiIds`; сохранить правило `explorationThreshold <= explorationLevel` для обычных POI.
2. Ввести общую функцию уменьшения `RemainingDays` и применить её к exploration и POI lifetime и другим счетчикам оставшихся дней.
3. Заменить `triggers: { onDayPass: [{ do: ... }] }` прямым `onDayPass: ChangeRegionParameterEffect[]` у template.
4. Реализовать `changeRegionParameter` строго для raw root-cell values: independent chance, defaults `min: 0`, `max: 999` и saturating behavior без принудительного возврата уже вышедшего за границу значения.
5. Ввести `markPoiForRemovalDraft`: рекурсивно помечает POI и его descendants, выключает их из новых transitions, occupancy и day-pass.
6. Убрать немедленное `removeSelf` из day-pass. В конце полного `onDayEnd` выполнить один dependency-aware physical removal sweep, включая inventory, guard/combat references, slot occupancy и current interaction.
7. Перестроить `world` day orchestration в документированный порядок: собрать начальный список POI, обработать POI day-pass/lifetime, обработать quest timers и их effects, выполнить конечный removal sweep, очистить дневную interaction memory и обновить occupancy в требуемом scope.
8. Применить порядок конца дня из `migration-decisions.md` (World Time): после day-pass/lifetime и quest-таймеров — removal sweep, затем очистка дневной interaction memory; после достижения конечного времени однократно разрешить occupancy конечного time slot, провалидировать текущий контекст и собрать новую interceptor queue (при открытом root она запускается сразу, во внутреннем Frame — ждёт возврата в root).

Критерий завершения: lifetime `1` исполняет последний day-pass, pending subtree не исполняет дальнейшие effects, а removal не оставляет dangling references.

## Фаза 4. NPC schedules, slots и occupancy

1. Заменить `INITIAL_NPCS: NpcDetails[]` registry на `Record<NpcId, InitialNpc>` и нормализовать runtime fields: affection, timesMet, lastDateMet, base schedule, personal action/interceptor IDs.
2. Удалить services из NPC. Не вводить faction fallback для отсутствующей faction.
3. Добавить `npcSlots` в POI templates с группами `work`, `freeTime`, `home`, `role`, immutable `candidateNpcIds`, chance и own Action/Interceptor IDs.
4. Реализовать resolved schedule: work slots открытого POI имеют приоритет над base state NPC; base schedule допускает только `freeTime`, `home`, `hidden`.
5. Реализовать occupancy algorithm в жёстком порядке `work -> freeTime -> home`, затем order in template arrays: сначала использовать exclusive `RuntimeSlotAssignment`; совместимый свободный assigned NPC занимает slot без chance. При отсутствии assignment выбрать из `candidateNpcIds` по resolved schedule, chance и случайному свободному candidate. Недоступный assigned NPC оставляет slot пустым без fallback.
6. Хранить три независимых слоя: immutable template candidates, persistent `RuntimeSlotAssignment` по `poiId + slotId` и slot-aware transient occupancy indexes для фактического размещения.
7. Запретить заполнение work slots закрытых POI. `isDiscovered` не должен останавливать simulation.
8. Реализовать обновление `timesMet` и `lastDateMet` при выходе из NPC context, не чаще одного раза за calendar day.
9. Проверить, что assignment не меняет `candidateNpcIds`, не перебрасывается при повторном входе в time slot и очищается только явной командой снятия назначения или при удалении POI.

Критерий завершения: один NPC не может занять два slots, закрытый POI не удерживает worker, slot root получает конкретные `slotId` и `npcId`.

## Фаза 5. Quest runtime и общий effects layer

1. Создать `questSlice` с runtime всех static quest definitions при новой игре: status, stage, vars, journal, visibility и timers.
2. Построить и после загрузки восстанавливать derived `questActionIdsByTarget` и `questInterceptorIdsByTarget`; при stage/status changes обновлять их инкрементально.
3. Реализовать только утверждённые lifecycle effects: `setQuestStage`, `setQuestVar`, `snapshotDefeatedCount`, `setQuestJournalVisibility`, `completeQuest`, `failQuest`.
4. Не переносить old quest definitions из service-based schema. Реализовать новый quest runtime на fixture quests из Фазы 1.1.
5. Реализовать stage/quest timers и их two-pass expiry order; выполнять собранные expiry effects после обоих countdown passes.
6. Ввести единый typed effect executor, который может быть вызван из Action, Interceptor, quest timer и POI day-pass. Он включает `modifyTension` только для утверждённого `forceExit`; не переносить текущие incomplete fallback handlers как целевой API.
7. Подключить resource costs к inventory/party/world только через Action executor, чтобы проверка и списание использовали одинаковые already-resolved amounts.
8. Политика non-quest Effect union решена (`migration-decisions.md`): только структурные эффекты + quest-эффекты + `modifyTension`; осталось перечислить обязательные структурные эффекты. К структурным относятся, в частности, `markCurrentPoiForRemoval`, `changeRegionParameter` и `disablePoiEntryForDays` (дневная блокировка входа в POI). Постоянную установку/снятие `isEntryDisabled` добавлять эффектами по мере необходимости — на старте постоянная блокировка задаётся в initial-данных POI. Правило «не более одного lifecycle-эффекта на квест в одном блоке effects» проверяется валидатором (`validation-contract.md`).

Критерий завершения: квест initial stage выдаёт target IDs, stage change обновляет оба индекса, завершённый quest больше не выдаёт content и его runtime остаётся компактным.

## Фаза 6. Frame, Action и Interceptor runtime

1. Реализовать `CurrentInteraction` как discriminated POI or slot/NPC context с обязательной парой `slotId + npcId`, `activeFrameId`, current background, log и typed pending Interceptor queue.
2. Заменить current services state/daily memory на subject-keyed daily Action/Interceptor memory и separate total counters. Subject: `poi:<poiId>` для POI и `npc:<npcId>` для slot/NPC. Дневной `tension` NPC хранится в его subject daily memory: резолвится при первом взаимодействии за день из effective relation (affection + репутация фракции + loyalty) и случайного отклонения, переиспользуется при повторных входах, стирается в конце дня. См. `tension-force-exit-and-poi-entry.md`.
3. Реализовать pure Action number resolver, check resolver, weighted-result resolver, conditions/requirements/cost resolver и cached daily appearance chance. RNG выполняет executor, а не authoring function or React selector.
4. Реализовать root option resolver по правилам документов: frame IDs; POI IDs; slot IDs; NPC IDs; quest indexes; runtime navigation. Внутренний Frame получает только own `frame.actionIds`.
5. Выполнить `performAction` в зафиксированном порядке: resolve cost once; debit upfront and count execution; check/select result; apply effects and append resolved narrative snapshot; execute transition; process time/world consequences; rebuild visible options.
6. Реализовать context switching POI <-> slot without party movement, с новым log при смене context и возвратом в current POI для `currentPoi` transition.
7. Реализовать interceptor snapshot collection, priority ordering, extraction-before-execution, recheck, silent continuation, pause on Frame and queue replacement after time-slot change.
8. Представить очередь типизированным union: authored Interceptor ID либо system `forceExit`, а не magic string среди `InterceptorId`.
9. При достижении порога дневным `tension` NPC вызвать idempotent `scheduleForceExit`: очистить authored queue, добавить единственный system queue item и сохранить его через time-slot refresh. Поскольку tension дневной и персистентный, forceExit повторяется при каждом новом входе к этому NPC в тот же день, пока значение на пороге или выше. Сильный авторский исход (forceExit-Frame) может применить `disablePoiEntryForDays` текущего POI и вывести игрока в parent.
10. Исполнять system `forceExit` только при достижении root текущего context. Он не прерывает внутренний Frame, не проходит authoring checks и не запускает обычную entry queue.
11. Разрешать force-exit Frame по reserved context ID. При его отсутствии использовать fallback: slot/NPC context возвращается в current POI, POI context переходит в parent. Внешний переход, POI removal или invalidated slot/NPC context очищает pending system item.
12. Удалить hard-coded UI handling для service IDs `leave` and `trade`; все transitions проходят через единый runtime executor and public world actions for external movement.

Критерий завершения: rerender/re-entry не перебрасывает appearance chance; failed check consumes cost and execution; return to root continues the same interceptor queue; scheduled force exit replaces authored queue but не прерывает внутренний Frame; transition to external POI uses world travel pipeline.

## Фаза 7. Narrative, UI и presentation

1. Использовать нейтральный narrative fixture content в Frames and Action/Interceptor results; не переносить old POI action/outcome tree.
2. Заменить `DialogPanel` consumption of `interactionLog` and `DialogOptions` consumption of services with the new log snapshots and resolved grouped interaction options.
3. В POI root показать frame/poi/quest actions, occupied slots and POI navigation as separate source groups; in slot root show frame/slot/personal/quest actions and return navigation; in internal Frame show only frame actions.
4. Убрать ImagePanel navigation through local-spot POIs. Child-POI navigation comes from `childPoiIds`; NPC interaction comes from occupied template slots and does not travel the party.
5. Получать root Frame IDs from `templateId` and slot root IDs from `templateId/slotId`, never from a runtime instance ID.
6. Implement background inheritance and reset on new interaction; resolve `$npc` and `{$npc}` once into log snapshots.
7. Preserve the existing trade modal only as the target of the new `trade` transition until the trade scope is approved.
8. Presentation в основном решена (`migration-decisions.md`): overlay composition (контекст-NPC справа, speaker слева, подсветка), baseline-визуалы через `import.meta.glob` (`src/assets/npcs/<npcId>/default.webp`), log snapshot = только resolved narrative blocks, закрытый POI = disabled-переход с пометкой «Закрыто» (аналогично `isEntryDisabled` → «Вход недоступен», `entryDisabledDaysLeft > 0` → «Вас сюда не пускают»; `pendingRemoval` вообще не предлагается). Остаётся открытым лишь расширенный visual-variant resolver (role/экипировка/состояние/настроение), отложенный в npc-доке.

Критерий завершения: UI does not branch on legacy service IDs, local spots or `poi.type`; it renders only derived options and immutable log snapshots.

## Фаза 8. World travel, initialization и legacy cleanup

1. Изменить travel and world guards from `type === 'cell'` to topology guard `parentId === null`.
2. Убрать 5-minute local-spot move. Travel between cells, cell/POI and ordinary parent-child POI follows the remaining agreed rules; any new expedition-points behavior stays out of scope.
3. Вынести new-game bootstrap в **отдельный шаг после `CharacterCreation`** — самостоятельный сборщик мира. По порядку зависимостей он инициализирует cells, сгруппированные POI, NPC runtime, quests и начальную occupancy, затем запускает игру (переключение `ui.currentScreen` на игровой экран). `CharacterCreation` лишь собирает выбор игрока и передаёт его bootstrap-шагу; сама сборка мира и старт не живут внутри экрана создания персонажа.
4. Проверить all callers of `travelToPoi` and external Action transitions for closed/pending-removal/discovery constraints.
5. После того как fixture set покрывает утверждённые сценарии, удалить deprecated active-code APIs and data: service rules, service state, `POI_NARRATIVES` flow, local spot templates/data, old quest services/narratives and old POI types/selectors.
6. Не удалять old docs until the new documentation reflects actual shipped behavior; mark historical docs as outdated or move them to an archive according to repository policy.

Критерий завершения: active source has no reads of legacy POI topology, services or `type` discriminator; a new game starts from only the new registries.

## Проверки и release gates

1. Run `npm run build` after every independently mergeable phase.
2. Add or agree deterministic coverage for: cell-ID parsing; two-pass POI initialization; normalizers; region level resolution; remaining-day decrease; pending-removal cascade; day-end ordering; slot assignment; occupancy uniqueness; quest index updates; Action cost/check/result execution; appearance cache; interceptor queue; external transition routing.
3. Add authoring validation checks for all explicitly specified data invariants before migrating content at scale.
4. Run manual vertical scenarios only with technical fixtures: enter open/closed POI; enter occupied slot; return to POI; execute Action success/fail; schedule force exit from `modifyTension`; verify its Frame and fallback; cross time slot; cross day; expire POI; advance quest and open the existing trade modal. Combat remains outside this migration.
5. Search active source after cleanup for `InteractionService`, `performService`, `services`, `isLocalSpot`, `localSpotIds`, `nestedPoiIds`, `poi.type`, `lifetimeDays`, `Infinity` as permanent lifetime, old quest-service maps and current narrative resolver imports.
6. Do not claim save/load compatibility until persistence is designed and validated.

## Dependency order

1. Phase 0 gates technical fixture authoring.
2. Phases 1-3 establish data and day-end invariants before UI/runtime work.
3. Phase 4 is required before slot/NPC interaction UI.
4. Phase 5 provides quest indexes and effects used by Phases 6-7.
5. Phase 6 is the runtime boundary that replaces services; Phase 7 consumes it.
6. Phase 8 happens only after all active callers have a replacement and the technical fixture set covers every approved contract.

No phase should silently fill an open item marked (13-16 "статус открытых вопросов") "Требует уточнения". Such a decision must be added to 'migration-decisions.md' first.
