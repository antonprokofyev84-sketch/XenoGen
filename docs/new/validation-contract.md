# Validation Contract — проверки initial-данных

## Статус и назначение

Документ консолидирует все проверки ссылочной целостности и авторских инвариантов, ранее разбросанные по initial-data докам (`poi`, `cell`, `npc`, `action`, `frame`, `quest`, `interceptors`, `RegionParameters`, `interaction-runtime-*`).

Валидатор работает только на этапе разработки/тестов (dev-time): при сборке контента и в Vitest. Он **не** является частью игрового рантайма и не влияет на производительность игры. Runtime полагается на то, что валидатор уже отсёк ошибки: он не дедуплицирует списки, не округляет числа и не «чинит» данные молча.

При ошибке — явный fail с указанием конкретного ID/пути, а не тихий fallback на `false`/дефолт.

---

## 1. Ссылочная целостность (cross-references)

Любая ссылка по ID обязана разрешаться в соответствующем реестре.

- `Frame.actionIds[*]` → `INITIAL_ACTIONS`
- `ActionTransition { type: 'frame'; frameId }` → `INITIAL_FRAMES`
- `ActionTransition { type: 'poi'; poiId }` → существующий POI instance id
- `poi.actionIds`, `slot.actionIds`, `npc.actionIds` → `INITIAL_ACTIONS`
- `poi.interceptorIds`, `slot.interceptorIds`, `npc.interceptorIds` → `INITIAL_INTERCEPTORS`
- `InterceptorResult.transition.frameId` (и в обеих ветках `check`) → `INITIAL_FRAMES`
- `slot.candidateNpcIds[*]` → `INITIAL_NPCS`
- `InitialPoi.templateId` → `POI_TEMPLATES`
- `InitialPoi.parentId` → существующая клетка или POI
- `questStage.actionIdsByTarget`: ключи (`QuestTargetId`) → существующий `npcId` или `poiId`; значения → `INITIAL_ACTIONS`
- `questStage.interceptorIdsByTarget`: ключи → `npcId`/`poiId`; значения → `INITIAL_INTERCEPTORS`
- Quest effects: `setQuestStage.{questId,stageId}`, `setQuestVar.questId`, `snapshotDefeatedCount.{questId,enemyTypeId}`, `setQuestJournalVisibility.questId`, `completeQuest/failQuest.questId` → соответствующие реестры
- Structural effects: явный `poiId` в `disablePoiEntryForDays` / `setPoiEntryDisabled` → существующий POI; `'$currentPoi'` допустим только в контексте с текущим POI; `changeRegionParameter.cellParam` → `RegionParameterKey`
- Условия: `affection.npcId`, `reputation.factionId`, `timesMet.npcId`, `defeated.enemyTypeId`, `questVar/questStatus.questId`, `baselineFromVar.questId` → соответствующие реестры
- `cost.items[*].itemId`, `ItemCondition.itemId`, `addItem.itemId`, `removeItem.itemId` → реестр предметов
- `InitialNpc.faction`, `InitialPoi.details.faction`, фракции в slot/quest → реестр фракций (включая явно созданный `independents`)

---

## 2. Структурная полнота

- `InitialNpc.baseSchedule` содержит все шесть `TimeOfDay`; каждое значение входит в `work | freeTime | home | hidden`.
- `PoiSchedule`, если задан, содержит все шесть `TimeOfDay`.
- `InitialCell.details.regionParameters` содержит все четыре ключа (`prosperity`, `techLevel`, `contamination`, `threat`).
- Каждый квест содержит стадию `initialStage`.
- Action имеет ровно одно из `result` / `check` (не оба и не ни одного). Interceptor — аналогично.
- `check` содержит обе ветки `onSuccess` / `onFail`; пустая по смыслу ветка записывается явно как `{}`.
- `WeightedActionResult[]` непустой, и у каждого элемента задан `weight`.
- Все effect descriptors используют discriminator `type`. В v1 union входят только утверждённые quest effects; structural `markCurrentPoiForRemoval`, `changeRegionParameter`, `disablePoiEntryForDays`, `setPoiEntryDisabled`; `modifyTension`; protagonist-inventory effects `addMoney`, `addItem`, `removeItem`.
- `FrameId` соответствует грамматике `contextId[:framePath]`, где slot context имеет вид `templateId/slotId`. Символы `/` и `:` не встречаются внутри `templateId`, `slotId` и отдельных сегментов `framePath`; имена `closed` и `forceExit` зарезервированы для системных Frames контекста.
- Дерево POI ациклично; `parentId` существует, `rootCellId` согласован с цепочкой родителей, а `childPoiIds` после сборки содержат только непосредственных детей.
- `slotId` уникален внутри template; `actionIds`, `interceptorIds` и `candidateNpcIds` не содержат повторов в одном списке.

---

## 3. Числовые инварианты

- `regionLevelOverrides[*]` — целое `0..9`.
- `regionLevelModifiers[*]` — целое (дельта уровня), не дробное.
- `regionParameters[*]` (raw клетки) — `0..999`; дробные допустимы.
- `lifetimeDaysLeft` в initial placement/template — `null` либо положительное целое. Значения `0`, отрицательные и дробные отклоняются, чтобы истёкший POI не успел выполнить лишний `onDayPass`.
- `explorationDaysLeft` в initial — `null` либо неотрицательное целое.
- `entryDisabledDaysLeft` в initial/runtime при наличии — положительное целое; нулевое состояние представлено отсутствием поля.
- `disablePoiEntryForDays.days`, `QuestTimeLimit.days`, `executionLimit.perDay` и `executionLimit.total` — положительные целые.
- Статические `appearanceChance` и `check.chance` — в `0..1`.
- Веса `ActionOutcome[]` неотрицательны, суммарный вес положителен.
- `InitialNpcSlot.chance` — `0..1`.
- `isEntryDisabled` при наличии имеет только значение `true`; разблокированный POI хранит `undefined`, а не `false`.
- Все статические authored numbers конечны (`Number.isFinite`). В частности, `changeRegionParameter.delta` и `modifyTension.delta` не допускают `NaN`/`Infinity`.
- Статические `cost.money`, `cost.stamina`, `cost.time` неотрицательны; `cost.items[*].count` — положительное целое. Те же ограничения проверяются после разрешения динамического `ActionNumber`.
- `addMoney.amount`, `addItem.count` и `removeItem.count` — положительные конечные числа; `addItem/removeItem.itemId` разрешаются в item registry.

---

## 4. Уникальность и запрет дублей

- Один `InterceptorId` не приходит в снимок из нескольких источников одного контекста — runtime не дедуплицирует.
- Один `ActionId` не попадает в несколько групп одного экрана (`frame` / `poi` / `slot` / `personal` / `quest`), иначе кнопка раздвоится.
- Один `ActionId` не приходит из нескольких источников root-контента.
- `CellId` уникальны; набор клеток фиксированной сетки полон и в границах.

---

## 5. Контекст и placeholders

- Условия с дефолтом «текущий субъект» (`affection` / `reputation` без явного id) размещаются там, где текущий субъект разрешим:
  - `affection` без `npcId` — только в slot/NPC-контексте;
  - `reputation` без `factionId` — у текущего субъекта (сначала NPC, затем POI) должна быть фракция; проверяется репутация игрока с этой фракцией;
  - неразрешимый текущий субъект — ошибка, а не `false`.
- `markCurrentPoiForRemoval`, `changeRegionParameter` и effects с `poiId: '$currentPoi'` размещаются только там, где runtime однозначно предоставляет текущий POI. Для `onDayPass` текущим считается POI-владелец; глобальный quest timer сам по себе такого контекста не создаёт.
- `modifyTension` размещается только в NPC-bearing interaction-контексте, где однозначно разрешается текущий NPC subject.

Полный reachability-анализ от root context до переиспользуемых Frames и Actions в первой версии валидатора не выполняется. Поэтому `$npc` и `npcDisplay: 'always'` проверяются runtime guard при фактическом входе в Frame; при отсутствии NPC runtime выбрасывает явную ошибку initial content.

---

## 6. Квестовые инварианты

- В одном блоке `effects` для одного квеста — не более одного lifecycle-эффекта (`setQuestStage` | `completeQuest` | `failQuest`). Правило одинаково для `ActionResult.effects`, `InterceptorResult.effects` и `QuestTimeLimit.onExpire`.
- `questVar` condition: ровно одно из `equals` / `notEquals`.
- Числовое comparison-condition задаёт хотя бы одно ограничение. `exact` не сочетается с `min`/`max`; при паре `min` + `max` выполняется `min <= max`. Это правило распространяется и на `regionLevel`.
- `setQuestStage` / `setQuestVar` / `snapshotDefeatedCount` не адресуются `completed` / `failed` квесту (авторский инвариант данных; рантайм дополнительно защищается от этого же случая).
- `CellId` имеет формат `{col}-{row}` с неотрицательными координатами (иначе `parseCellId` бросает исключение).

---

## 7. Runtime guards, не относящиеся к initial-данным

- `RuntimeSlotAssignment.assignedNpcId` обязан разрешаться в `INITIAL_NPCS`, а ключ assignment — в существующие `poiId + slotId`. Это проверяется при создании/изменении assignment, а не initial-data validator.
- Фактический occupant должен соответствовать глобальному resolved schedule, быть свободен и занимать не более одного slot. Для work slot дополнительно обязательны `baseSchedule[currentTimeOfDay] === 'work'`, candidate/assignment связь и открытый POI. Это инвариант occupancy resolver.
- Один NPC не может иметь две работы: static `candidateNpcIds` допускают NPC максимум в одном `work` slot; runtime work assignment supersedes static work membership, а один NPC допускается максимум в одном runtime work assignment.
- Динамическое число после разрешения проверяется на конечность и по диапазону своего поля; authoring-функция не может обойти ограничения chance, веса или cost.

---

## 8. Чего валидатор не делает

- Не проверяет загруженный save — save/load вне скоупа миграции.
- Не валидирует, что NPC реально занимает указанный slot: это рантайм-инвариант occupancy, а не initial-данных.
- Не правит, не округляет и не дополняет данные — только отклоняет с конкретной ошибкой.
