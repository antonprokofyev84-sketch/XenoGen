нпс - когда видились последний раз. и константа через сколько можно снова увидеть .

если у пои уже есть инвентарь то битва не генерирует новый. в то же время эквипмент с врагов всегда падает дополнительно с шансом после битвы помимо инвентаря

что может быть в пои
{
id: string;
parentId: string | null; // null = корень (ячейка)
nestedPois: string[];
localSpots: string[];
rootCellId: string;
type, // что то типа пои тэмплэйт айди.
faction,

    services

    inventory,
    guard


    details {

isDiscovered: boolean;
explorationThreshold: number;

     lastTimeVisited

created date
lifetime
refresh date // for inventory and guard refresh?

    }

    interceptor // чтобы перебросить при входе на другую пои - например при первом входе в город на авнпост охраны и тп.
    regionParameters // overwrite or add modificators to the threat prosperity techLevel contamination

}

это все не нужно потому что будет динамически расчитываться на базе threat prosperity techLevel contamination
level?: number;
progress?: number;
progressMax?: number;

## Plan: Universal POI Migration Without Combat/Economy

Цель: перевести POI-модель на универсальные non-cell узлы с content key в поле type, убрать legacy runtime-категории и старую progress/level-схему, разделить дерево на nested/local связи, не трогая переписывание боевой системы и не включая экономику или баланс врагов от region parameters.

Подход: сначала стабилизировать типовую модель и инварианты данных, затем мигрировать фабрику и slice, потом адаптировать стратегии, travel, UI и документацию, завершив миграцию проверками и зачисткой legacy API.

**Steps**

1. Фаза 0. Scope Lock и миграционные инварианты. Создать отдельный документ инвариантов в кодовой базе для ревью и реализации: что включено и что исключено. Включить четыре жестких правила: non-cell POI только универсальные, poiTemplateId полностью удаляется, childrenIds полностью заменяется на nestedPoiIds/localSpotIds, progress/level/levels полностью удаляются. Зафиксировать, что combat rewrite и economy scaling исключены из этой миграции.
2. Фаза 1. Типовая основа POI. Обновить типы в [xeno-gen/src/types/poi/common.ts](xeno-gen/src/types/poi/common.ts), [xeno-gen/src/types/poi/cell.ts](xeno-gen/src/types/poi/cell.ts), [xeno-gen/src/types/poi/nodes.ts](xeno-gen/src/types/poi/nodes.ts), [xeno-gen/src/types/poi/shared.ts](xeno-gen/src/types/poi/shared.ts), [xeno-gen/src/types/poi/initial.ts](xeno-gen/src/types/poi/initial.ts), [xeno-gen/src/types/poi/templates.ts](xeno-gen/src/types/poi/templates.ts), [xeno-gen/src/types/poi/effects.ts](xeno-gen/src/types/poi/effects.ts).
3. Фаза 1.1. В [xeno-gen/src/types/poi/common.ts](xeno-gen/src/types/poi/common.ts) заменить childrenIds на nestedPoiIds/localSpotIds, добавить isLocalSpot mirror-флаг, оставить cell как единственный специальный runtime type.
4. Фаза 1.2. В [xeno-gen/src/types/poi/nodes.ts](xeno-gen/src/types/poi/nodes.ts) убрать discriminated union по encounter/facility/spot/generic. Оставить союз из CellPoiNode и универсального NonCellPoiNode. Удалить legacy guards isEncounter/isFacility/isSpot/isGeneric и заменить на утилиты, не завязанные на runtime category.
5. Фаза 1.3. В [xeno-gen/src/types/poi/cell.ts](xeno-gen/src/types/poi/cell.ts) заменить плоские threat/prosperity/contamination на details.regionParameters c четырьмя ключами threat/prosperity/contamination/techLevel.
6. Фаза 1.4. В [xeno-gen/src/types/poi/templates.ts](xeno-gen/src/types/poi/templates.ts) удалить TemplatePoiType, PoiTemplateLevel, AnyPoiTemplate union по runtime-категориям, levels и level-specific overrides. Оставить универсальный template с type:string, optional details/serviceIds/npcPlacement/triggers.
7. Фаза 1.5. В [xeno-gen/src/types/poi/effects.ts](xeno-gen/src/types/poi/effects.ts) удалить modifySelfProgress и любые actions, завязанные на progress/level. Расширить CellParam до threat/prosperity/contamination/techLevel.
8. Фаза 2. Унификация initial data. Обновить [xeno-gen/src/data/initialPoi.ts](xeno-gen/src/data/initialPoi.ts) на новый формат: non-cell узлы с type:string, optional isLocalSpot, без poiTemplateId и без runtime type spot/facility/encounter. Для cell сохранить отдельный initial type.
9. Фаза 2.1. Параллельно обновить связанные типы initial в [xeno-gen/src/types/poi/initial.ts](xeno-gen/src/types/poi/initial.ts) и импорты-реэкспорты в [xeno-gen/src/types/poi/index.ts](xeno-gen/src/types/poi/index.ts), чтобы seed-данные валидировались строго по новой схеме.
10. Фаза 3. Миграция POI factory. Переписать [xeno-gen/src/systems/poi/poiFactory.ts](xeno-gen/src/systems/poi/poiFactory.ts) на единую ветку создания non-cell POI без dispatch по runtime category.
11. Фаза 3.1. При создании runtime узла всегда инициализировать nestedPoiIds/localSpotIds пустыми массивами.
12. Фаза 3.2. В initialize/create пути добавить правило маршрутизации дочернего узла: isLocalSpot true ведет в parent.localSpotIds, иначе в parent.nestedPoiIds.
13. Фаза 3.3. Удалить обработку poiTemplateId, level, progress, progressMax и level-cascade merge.
14. Фаза 3.4. Ввести resolver effective region parameters: base из root cell details.regionParameters, затем override poi.details.regionParameters, затем modifiers poi.details.regionParameterModifiers, затем clamp минимум 0.
15. Фаза 4. Миграция POI slice и селекторов. Обновить [xeno-gen/src/state/gameSlices/poi.ts](xeno-gen/src/state/gameSlices/poi.ts): все проходы по childrenIds, все операции добавления/удаления поддеревьев, селекторы детей и discovered children.
16. Фаза 4.1. Добавить helper API в POI-домене: getNestedPoiIds, getLocalSpotIds, getAllChildPoiIds, isLocalSpotPoi, getLocalAreaRootPoiId, getLocalPoiIds, getLocalNpcIds.
17. Фаза 4.2. Ввести clear инварианты удаления узлов: при remove subtree очищать ссылки из обоих массивов родителя и каскадно удалять потомков по объединенному списку nested+local.
18. Фаза 4.2.1. Добавить обязательный каскадный cleanup pipeline при любом удалении POI (removeSelf и remove subtree): вызывать очистку связанных данных по poiId в сторонних slice, минимум clearInventory/removeContainer(poiId), clearGuard/clearCombatByPoiId(poiId), clearPoiOccupancy(poiId).
19. Фаза 4.2.2. Ввести единый middleware или orchestrator-экшен удаления (например removePoiWithDependencies), чтобы cleanup нельзя было пропустить при прямом вызове removeSelf из effect manager.
20. Фаза 4.2.3. Зафиксировать порядок очистки: сначала отвязка от родителя и сбор списка потомков, затем cleanup зависимостей для каждого poiId, затем физическое удаление узлов из poiSlice.
21. Фаза 4.3. Выделить helper getAllChildPoiIds как единственный источник для legacy сценариев где нужен старый смысл все дети.
22. Фаза 5. Обновление interaction и narrative context без poiTemplateId. Обновить [xeno-gen/src/state/gameSlices/interaction.ts](xeno-gen/src/state/gameSlices/interaction.ts), [xeno-gen/src/systems/narrative/narrativeResolver.ts](xeno-gen/src/systems/narrative/narrativeResolver.ts), [xeno-gen/src/types/narrative.types.ts](xeno-gen/src/types/narrative.types.ts), [xeno-gen/src/systems/poi/poiImageResolver.ts](xeno-gen/src/systems/poi/poiImageResolver.ts).
23. Фаза 5.1. В CurrentInteraction заменить поле poiTemplateId на поле type или contentKey с тем же смыслом ключа контента.
24. Фаза 5.2. Narrative и image resolver должны получать этот content key напрямую, без промежуточных legacy полей.
25. Фаза 5.3. Все UI-места, читающие poi.details.poiTemplateId, перевести на новый ключ.
26. Фаза 6. Миграция POI templates и onDayPass effects. Обновить [xeno-gen/src/data/poi.templates.ts](xeno-gen/src/data/poi.templates.ts), [xeno-gen/src/systems/poi/poiStrategies.ts](xeno-gen/src/systems/poi/poiStrategies.ts), [xeno-gen/src/systems/effects/poiEffectManager.ts](xeno-gen/src/systems/effects/poiEffectManager.ts).
27. Фаза 6.1. Удалить levels и прогресс-действия из шаблонов.
28. Фаза 6.2. Сохранить универсальный trigger pipeline onDayPass, но без category-specific ветвлений кроме cell.
29. Фаза 6.3. changeCurrentCellParam должен работать через cell.details.regionParameters[cellParam].
30. Фаза 7. Миграция UI-навигации на nested/local модель. Обновить [xeno-gen/src/features/PoiView/components/ImagePanel/ImagePanel.tsx](xeno-gen/src/features/PoiView/components/ImagePanel/ImagePanel.tsx), [xeno-gen/src/features/PoiView/components/ImagePanel/SubPoiCard.tsx](xeno-gen/src/features/PoiView/components/ImagePanel/SubPoiCard.tsx), [xeno-gen/src/features/StrategicMap/components/LeftPanel/LeftPanel.tsx](xeno-gen/src/features/StrategicMap/components/LeftPanel/LeftPanel.tsx).
31. Фаза 7.1. Для UI-навигации между областями использовать nestedPoiIds.
32. Фаза 7.2. Для локальных точек сцены использовать localSpotIds.
33. Фаза 7.3. Ввести композиционное правило narrative на входе: основной narrative узла плюс intro-блоки по занятым local spots.
34. Фаза 8. NPC placement и локальные проверки области. Уточнить контракт между POI и occupancy в [xeno-gen/src/state/gameSlices/occupancy.ts](xeno-gen/src/state/gameSlices/occupancy.ts): POI хранит authored npcPlacement, runtime occupancy живет только в occupancy slice по poiId.
35. Фаза 8.1. Реализовать getLocalNpcIds так, чтобы включались NPC в текущем poiId и его localSpotIds, но не nestedPoiIds.
36. Фаза 8.2. Реализовать getLocalAreaRootPoiId для witness/aggression/local-area сценариев.
37. Фаза 9. Упрощение travel semantics. Обновить [xeno-gen/src/systems/travel/travelManager.ts](xeno-gen/src/systems/travel/travelManager.ts) и [xeno-gen/src/data/travel.rules.ts](xeno-gen/src/data/travel.rules.ts) под матрицу: cell-cell 120 минут, cell-any или any-cell 30 минут, если source или target local spot 5 минут, иначе 15 минут.
38. Фаза 9.1. Явно зафиксировать приоритет правил в коде и тестах, чтобы не было неоднозначности.
39. Фаза 9.2. Удалить зависимость travel от runtime type settlement.
40. Фаза 10. Документация и консистентность терминов. Обновить [xeno-gen/docs/PoiSystem.md](xeno-gen/docs/PoiSystem.md), [xeno-gen/docs/RegionParameters.md](xeno-gen/docs/RegionParameters.md), [xeno-gen/docs/NpcSpatialSystem.md](xeno-gen/docs/NpcSpatialSystem.md) и при необходимости [xeno-gen/docs/NarrativeSystem.md](xeno-gen/docs/NarrativeSystem.md).
41. Фаза 10.1. В документации унифицировать techLevel и supplyTier, выбрав один канонический термин и явно прописав mapping в переходный период.
42. Фаза 11. Legacy cleanup. Удалить файлы и типы старой схемы в пределах активного кода: [xeno-gen/src/types/poi/encounter.ts](xeno-gen/src/types/poi/encounter.ts), [xeno-gen/src/types/poi/facility.ts](xeno-gen/src/types/poi/facility.ts), [xeno-gen/src/types/poi/spot.ts](xeno-gen/src/types/poi/spot.ts), [xeno-gen/src/types/poi/generic.ts](xeno-gen/src/types/poi/generic.ts) или оставить их временно как thin compatibility wrappers до полного удаления всех импортов.
43. Фаза 11.1. После чистки выполнить глобальный поиск по проекту на остатки poiTemplateId, childrenIds, progress/progressMax/level, TemplatePoiType, PoiTemplateLevel, runtime strings encounter/facility/spot в логике branch/discriminator.

**Parallelism and Dependencies**

1. Параллельно после Фазы 1 можно вести три ветки: initial data migration, template migration и docs migration.
2. Фаза 3 блокирует Фазу 4, потому что slice инициализация зависит от нового factory behavior.
3. Фаза 4 блокирует Фазы 7 и 8, потому что UI и local-area helpers завязаны на новый граф.
4. Фаза 5 можно делать параллельно с Фазой 7 после стабилизации новых типов non-cell POI.
5. Фаза 9 лучше запускать после Фазы 4 и до финальных проверок, чтобы сразу поймать регрессии перемещения.

**Relevant files**

- [xeno-gen/src/types/poi/common.ts](xeno-gen/src/types/poi/common.ts) — базовый каркас узла, split children на nested/local и isLocalSpot.
- [xeno-gen/src/types/poi/cell.ts](xeno-gen/src/types/poi/cell.ts) — перенос региональных параметров в grouped regionParameters.
- [xeno-gen/src/types/poi/nodes.ts](xeno-gen/src/types/poi/nodes.ts) — удаление runtime category union и guards.
- [xeno-gen/src/types/poi/shared.ts](xeno-gen/src/types/poi/shared.ts) — единые поля discoverability/region overrides/modifiers.
- [xeno-gen/src/types/poi/templates.ts](xeno-gen/src/types/poi/templates.ts) — универсальная template-модель без levels.
- [xeno-gen/src/types/poi/effects.ts](xeno-gen/src/types/poi/effects.ts) — action types после удаления progress/level.
- [xeno-gen/src/types/poi/initial.ts](xeno-gen/src/types/poi/initial.ts) — новая initial схема.
- [xeno-gen/src/systems/poi/poiFactory.ts](xeno-gen/src/systems/poi/poiFactory.ts) — единый путь сборки runtime POI и parent linking.
- [xeno-gen/src/state/gameSlices/poi.ts](xeno-gen/src/state/gameSlices/poi.ts) — главные селекторы, create/remove, processDayPass/processPoiEnter.
- [xeno-gen/src/systems/poi/poiStrategies.ts](xeno-gen/src/systems/poi/poiStrategies.ts) — универсальные стратегии кроме cell special-case.
- [xeno-gen/src/systems/effects/poiEffectManager.ts](xeno-gen/src/systems/effects/poiEffectManager.ts) — удаление progress actions и region param update path.
- [xeno-gen/src/data/poi.templates.ts](xeno-gen/src/data/poi.templates.ts) — template trigger/content migration.
- [xeno-gen/src/data/initialPoi.ts](xeno-gen/src/data/initialPoi.ts) — миграция seed-данных.
- [xeno-gen/src/state/gameSlices/interaction.ts](xeno-gen/src/state/gameSlices/interaction.ts) — переход с poiTemplateId на новый content key.
- [xeno-gen/src/systems/narrative/narrativeResolver.ts](xeno-gen/src/systems/narrative/narrativeResolver.ts) — narrative lookup по новому ключу.
- [xeno-gen/src/features/PoiView/components/ImagePanel/ImagePanel.tsx](xeno-gen/src/features/PoiView/components/ImagePanel/ImagePanel.tsx) — переход UI дерева на nested/local.
- [xeno-gen/src/features/StrategicMap/components/LeftPanel/LeftPanel.tsx](xeno-gen/src/features/StrategicMap/components/LeftPanel/LeftPanel.tsx) — отображение POI в cell.
- [xeno-gen/src/state/gameSlices/occupancy.ts](xeno-gen/src/state/gameSlices/occupancy.ts) — runtime occupancy по poiId для local-area helpers и обязательной очистки при удалении POI.
- [xeno-gen/src/state/gameSlices/inventory.ts](xeno-gen/src/state/gameSlices/inventory.ts) — cleanup контейнера POI по poiId при removeSelf/remove subtree.
- [xeno-gen/src/systems/effects/poiEffectManager.ts](xeno-gen/src/systems/effects/poiEffectManager.ts) — removeSelf должен идти через orchestrator удаления с каскадной очисткой зависимостей.
- [xeno-gen/src/systems/travel/travelManager.ts](xeno-gen/src/systems/travel/travelManager.ts) — новая матрица travel.
- [xeno-gen/src/data/travel.rules.ts](xeno-gen/src/data/travel.rules.ts) — синхронные константы travel.
- [xeno-gen/docs/PoiSystem.md](xeno-gen/docs/PoiSystem.md) — спецификация новой модели.
- [xeno-gen/docs/RegionParameters.md](xeno-gen/docs/RegionParameters.md) — каноничный формат параметров и резолв.

**Verification**

1. Типы и сборка. Выполнить npm run build после каждой крупной фазы и фиксировать изменения числа ошибок.
2. Поиск legacy следов. Выполнить глобальный поиск по исходникам на строки poiTemplateId, childrenIds, progressMax, modifySelfProgress, PoiTemplateLevel, TemplatePoiType, type === 'spot', type === 'encounter', type === 'facility'.
3. Инициализация POI-графа. Запустить новую игру, проверить что все non-cell узлы имеют корректные parentId/rootCellId, и что local/nested связи симметричны правилам isLocalSpot.
4. Навигация по сцене. Войти в POI с локальными точками и вложенными подлокациями, проверить что переходы строятся по nested/local как запланировано.
5. Discovery. Проверить, что isDiscovered и explorationThreshold продолжают работать при split child arrays.
6. Day pass. Проверить processDayPass и trigger-effects без progress/level действий.
7. Region resolver. Проверить override/modifier порядок и clamp для отрицательных значений.
8. Очистка зависимостей на удаление. Для removeSelf и remove subtree проверить, что для каждого удаляемого poiId вызываются cleanup-хуки внешних slice: inventory, guard/combat, occupancy, и не остаются зависшие записи по poiId.
9. Порядок cleanup. Проверить, что orchestrator удаления соблюдает порядок: collect descendants -> dependency cleanup -> poi deletion.
10. Occupancy/local helpers. Проверить getLocalAreaRootPoiId и getLocalNpcIds на кейсах local spot, обычного nested узла и отсутствующего parent.
11. Narrative/image context. Проверить, что рендер контента использует новый content key во всех местах, где раньше был poiTemplateId.
12. Travel матрица. Проверить все четыре ветки: cell-cell 120, cell-any 30, localSpot-involved 5, прочее 15.
13. Регрессии сохранений. Проверить save/load на мигрированной модели POI.

**Decisions**

- Включено: полная POI-модель, type system, initial data, factory, slice, selectors, helpers, narrative/image key migration, travel simplification, docs.
- Исключено: переписывание боевой системы и ее внутренней архитектуры.
- Исключено: экономика и баланс врагов, завязанные на unified region parameters; допускается только подготовка структуры данных и резолвера параметров без балансного использования.
- Cell остается специальным корневым типом; non-cell POI становятся универсальными интерактивными узлами.
- isLocalSpot рассматривается как mirror-флаг, источник истины для дерева это parent arrays.

- При удалении POI cleanup зависимостей обязателен и централизован: removeSelf/remove subtree должны идти через единый orchestrator, который очищает inventory, guard/combat и occupancy по poiId до удаления узла.
  **Further Considerations**

1. Терминология параметров. Рекомендация выбрать один канонический термин: Option A использовать только techLevel в коде и docs, Option B оставить supplyTier в docs и делать mapping в коде, Option C поддержать alias в переходный период с дедлайном удаления.
2. Поле interceptor. Рекомендация выбрать одно имя в модели: Option A interceptor, Option B interceptorId, Option C оставить текущий вариант и добавить migration alias с коротким сроком жизни.
3. Переход для существующих сейвов. Рекомендация заранее решить стратегию: Option A одноразовый state migrator old-to-new, Option B не поддерживать старые сейвы и явно задокументировать break, Option C временная двусторонняя совместимость на один релиз.

poi as unknown as CellPoiNode
