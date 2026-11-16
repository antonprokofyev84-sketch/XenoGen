# POI: размещение, templates и slots

Формат: [poiContent.types.ts](../../src/types/poiContent.types.ts),
runtime: [worldNode.types.ts](../../src/types/worldNode.types.ts).

POI — узел места в дереве мира. Внутренние NPC slots описывают места и роли
персонажей внутри узла; они не образуют дополнительные POI.

## Placements и templates

`INITIAL_POIS_BY_CELL` в `src/data/initial/pois.ts` группирует экземпляры по root cell.
Каждая запись содержит уникальный `id`, `templateId`, непосредственный `parentId`
и начальные `details`. Родитель — клетка либо другой POI.

`POI_TEMPLATES` в `src/data/initial/poiTemplates.ts` задаёт механику места:
начальные details, schedule, Actions, Interceptors, NPC slots, локальные уровни
и `onDayPass`. Несколько экземпляров могут использовать один template.

`templateId` — ссылка на definition, а не категория вроде «таверна».
У уникальной авторской таверны он может совпадать с `id`; несколько встреч
с группами мусорщиков используют один `scavengerGroup` с разными instance IDs.
Изменения одного экземпляра сохраняются в его runtime, исходный template immutable.
Текст, фон и отображение сцены принадлежат [Frames](frame-initial-data-design.md).

Инициализация проходит в два этапа: создать все узлы, затем связать родителей
и непосредственных детей. `rootCellId` задаётся группой placement. Runtime хранит
конкретные instance IDs, а корневой Frame выбирается по template.
Порядок записей в группе не важен. `childPoiIds` содержит непосредственных детей,
а `parentId` должен вести к клетке той же группы через ацикличную цепочку родителей.
Требования к ссылкам и топологии, а также текущее покрытие собраны в
[контракте валидации](validation-contract.md).

Пример размещения (указанные templates определяются отдельно):

```ts
export const INITIAL_POIS_BY_CELL = {
  '3-1': [
    { id: 'dustTown', templateId: 'dustTown', parentId: '3-1', details: { isDiscovered: true } },
    { id: 'redBoar', templateId: 'redBoar', parentId: 'dustTown', details: { isDiscovered: true } },
    { id: 'scavengersA', templateId: 'scavengerGroup', parentId: '3-1', details: {} },
    {
      id: 'scavengersB',
      templateId: 'scavengerGroup',
      parentId: '3-1',
      details: { lifetimeDaysLeft: 2 },
    },
  ],
};
```

У таверны непосредственный родитель — город, root cell — `3-1`.
У двух групп мусорщиков общая механика, но независимые состояние и
[память взаимодействий](interaction-runtime-state-design.md#память-исполнения).

## Details и расписание

| Поле                   | Начальное значение                     |
| ---------------------- | -------------------------------------- |
| `isDiscovered`         | `false`; placement может задать `true` |
| `explorationThreshold` | placement → template → 0               |
| `lifetimeDaysLeft`     | placement → template → `null`          |
| `faction`              | placement → template → `undefined`     |
| `visitedTimes`         | placement → 0                          |
| `lastTimeVisited`      | placement → `null`                     |

Template задаёт defaults только для `explorationThreshold`, `lifetimeDaysLeft`
и `faction`. Обнаружение, посещения и
[блокировки входа](tension-force-exit-and-poi-entry.md#вход-в-poi) принадлежат экземпляру.
В initial `isDiscovered` записывается только как `true`; отсутствие нормализуется
в обязательный runtime `false`. Остальные defaults также разрешаются при создании узла.

У `lifetimeDaysLeft` положительное целое — оставшееся число границ дня,
`null` — бессрочный POI. Placement с явным `null` переопределяет срок template.
Initial-срок `0` недопустим: ноль возникает при истечении в runtime и приводит
к пометке. `null` сохраняется через JSON, в отличие от `Infinity`.

Schedule задаёт `open`/`closed` для всех шести частей суток; без schedule POI открыт
постоянно. При инициализации schedule копируется в runtime и может меняться там.
Открытость определяется расписанием. Вход проверяет
[доступность POI](tension-force-exit-and-poi-entry.md#вход-в-poi).
Работники не определяют открытость: пустой POI может быть открыт, занятые slots
не отменяют расписание. Связь открытия с work slots описана в
[размещении NPC](npc-initial-data-design.md#расписания-и-occupancy).

## Контент места и навигация

`actionIds` и `interceptorIds` template относятся к самому месту, например
осмотру таверны. Контент slot относится к услуге или роли, личный контент NPC
следует за персонажем. Runtime объединяет источники по
[правилам root](interaction-runtime-state-design.md#контекст-и-варианты-действий).

Обычные переходы к родителю, обнаруженным дочерним POI и занятым slots выводятся
из мира. Авторский Action нужен для перехода с собственной проверкой, стоимостью,
текстом или effects; перечислять все обычные выходы в `actionIds` не требуется.

## Посещения

При выходе из узла `visitedTimes` увеличивается максимум раз за календарный день,
а `lastTimeVisited` обновляется на время каждого выхода. Это правило общее для
клеток и POI; простой вход и повторные выходы того же дня не создают новых дней посещения.

## NPC slots

Template группирует slots по `work`, `freeTime`, `home`. У slot:

- локальный `id` и отображаемая `role`;
- immutable `candidateNpcIds` для автоматического заполнения;
- optional `chance` заполнения, default — 1;
- `actionIds` и `interceptorIds`, относящиеся к этому месту и роли.

Slot — место для occupant внутри POI. Роль принадлежит slot; имя и личные Actions — NPC.
Пустой candidate pool позволяет оставить место для персонального назначения.
`RuntimeSlotAssignments[poiId][slotId]` хранит назначенного NPC отдельно от template.
Алгоритм заполнения и расписания принадлежат [NPC](npc-initial-data-design.md#расписания-и-occupancy).

Например, построенная мастерская использует work slot с пустым candidate pool.
Назначение мастера записывается по паре instance `poiId + slotId`, поэтому
не переписывает candidate pools остальных мастерских с тем же template.
Текущий occupant хранится в occupancy отдельно от definitions и assignments.

Если [квестовое событие](quest-system-design.md#привязки-и-индексы) нужно именно
у барной стойки, его ID размещается в `slot.interceptorIds`, а актуальность задаётся
conditions. Так событие принадлежит месту, даже если бармен сменился.

Локальные региональные overrides/modifiers и `onDayPass` описаны в
[региональных параметрах](RegionParameters.md).

## Жизненный цикл

Пометка выражает завершение контента через выбранный автором Action. Пустой
инвентарь сам по себе не завершает POI: у торговца можно купить всё и остаться.

`markCurrentPoiForRemoval` рекурсивно помечает узел и потомков `pendingRemoval`.
Помеченные узлы исключаются из новых входов и дневных effects; выход остаётся доступен.
Пометка идемпотентна и сохраняет объект до общей очистки: Action может применить
effect и выполнить `transition: { type: 'parentPoi' }`, используя ещё существующего родителя.

В дневной фазе фиксируется список существующих POI. Первый проход выполняет
`onDayPass` непомеченных узлов; второй уменьшает их сроки жизни и при нуле
помечает поддерево. Перед каждым узлом пометка проверяется заново.
POI с последним днём жизни успевает выполнить свой дневной effect, если не был
помечен раньше. Созданный во время дневной обработки POI начнёт участвовать
со следующего тика. Скрытые POI также симулируются: обнаружение меняет видимость,
а не существование места в мире.

Общий sweep физически удаляет помеченные узлы и очищает ссылки родителей,
occupancy, назначения, инвентари и POI-память. Если партия находится в удаляемом
узле, она перемещается к первому сохранившемуся предку. Самостоятельный NPC
сохраняется при удалении его места.
Его отношения, встречи и дневная NPC-память также не принадлежат удаляемому POI.

Порядок относительно таймеров квестов и смены time slot задан в
[мировом времени](interaction-runtime-state-design.md#мировое-время-и-конец-дня).
