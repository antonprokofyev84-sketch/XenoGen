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
- `slot.candidateNpcIds[*]`, `RuntimeSlotAssignment.assignedNpcId` → `INITIAL_NPCS`
- `InitialPoi.templateId` → `POI_TEMPLATES`
- `InitialPoi.parentId` → существующая клетка или POI
- `questStage.actionIdsByTarget`: ключи (`QuestTargetId`) → существующий `npcId` или `poiId`; значения → `INITIAL_ACTIONS`
- `questStage.interceptorIdsByTarget`: ключи → `npcId`/`poiId`; значения → `INITIAL_INTERCEPTORS`
- Эффекты: `setQuestStage.{questId,stageId}`, `setQuestVar.questId`, `snapshotDefeatedCount.{questId,enemyTypeId}`, `completeQuest/failQuest.questId`, `modifyNpcAffection.npcId`, `modifyFactionReputation.factionId` → соответствующие реестры
- Условия: `affection.npcId`, `reputation.factionId`, `defeated.enemyTypeId`, `questVar/questStatus.questId`, `baselineFromVar.questId` → соответствующие реестры
- `cost.items[*].itemId`, `ItemCondition.itemId` → реестр предметов
- `InitialNpc.faction`, `InitialPoi.details.faction`, фракции в slot/quest → реестр фракций (включая явно созданный `independents`)

---

## 2. Структурная полнота

- `InitialNpc.baseSchedule` содержит все шесть `TimeOfDay`.
- `PoiSchedule`, если задан, содержит все шесть `TimeOfDay`.
- `InitialCell.details.regionParameters` содержит все четыре ключа (`prosperity`, `techLevel`, `contamination`, `threat`).
- Каждый квест содержит стадию `initialStage`.
- Action имеет ровно одно из `result` / `check` (не оба и не ни одного). Interceptor — аналогично.
- `check` содержит обе ветки `onSuccess` / `onFail`; пустая по смыслу ветка записывается явно как `{}`.
- `WeightedActionResult[]` непустой, и у каждого элемента задан `weight`.

---

## 3. Числовые инварианты

- `regionLevelOverrides[*]` — целое `0..9`.
- `regionLevelModifiers[*]` — целое (дельта уровня), не дробное.
- `regionParameters[*]` (raw клетки) — `0..999`; дробные допустимы.
- `lifetimeDaysLeft` в initial placement/template — `null` либо положительное целое. Значения `0`, отрицательные и дробные отклоняются, чтобы истёкший POI не успел выполнить лишний `onDayPass`.
- `explorationDaysLeft` в initial — `null` либо неотрицательное целое.
- Статические `appearanceChance` и `check.chance` — в `0..1`.
- Веса `ActionOutcome[]` неотрицательны, суммарный вес положителен.
- `InitialNpcSlot.chance` — `0..1`.

---

## 4. Уникальность и запрет дублей

- Один `InterceptorId` не приходит в снимок из нескольких источников одного контекста — runtime не дедуплицирует.
- Один `ActionId` не попадает в несколько групп одного экрана (`frame` / `poi` / `slot` / `personal` / `quest`), иначе кнопка раздвоится.
- Один `ActionId` не приходит из нескольких источников root-контента.
- `CellId` уникальны; набор клеток фиксированной сетки полон и в границах.

---

## 5. Контекст и placeholders

- `speakerId: "$npc"` и placeholder `{$npc}` используются только там, где в interaction-контексте присутствует `npcId`.
- `npcDisplay: "always"` требует `npcId` в контексте Frame.
- Условия с дефолтом «текущий субъект» (`affection` / `reputation` без явного id) размещаются там, где текущий субъект разрешим:
  - `affection` без `npcId` — только в slot/NPC-контексте;
  - `reputation` без `factionId` — у текущего субъекта (сначала NPC, затем POI) должна быть фракция; проверяется репутация игрока с этой фракцией;
  - неразрешимый текущий субъект — ошибка, а не `false`.

---

## 6. Квестовые инварианты

- В одном блоке `effects` для одного квеста — не более одного lifecycle-эффекта (`setQuestStage` | `completeQuest` | `failQuest`). Правило одинаково для `ActionResult.effects`, `InterceptorResult.effects` и `QuestTimeLimit.onExpire`.
- `questVar` condition: ровно одно из `equals` / `notEquals`.
- `setQuestStage` / `setQuestVar` / `snapshotDefeatedCount` не адресуются `completed` / `failed` квесту (авторский инвариант данных; рантайм дополнительно защищается от этого же случая).
- `CellId` имеет формат `{col}-{row}` с неотрицательными координатами (иначе `parseCellId` бросает исключение).

---

## 7. Чего валидатор не делает

- Не проверяет загруженный save — save/load вне скоупа миграции.
- Не валидирует, что NPC реально занимает указанный slot: это рантайм-инвариант occupancy, а не initial-данных.
- Не правит, не округляет и не дополняет данные — только отклоняет с конкретной ошибкой.
