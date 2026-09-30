# Initial NPC Data Design

## Статус и область документа

Документ фиксирует initial-описание NPC:

- идентичность NPC;
- начальную принадлежность к фракции;
- начальное отношение к игроку;
- счётчик состоявшихся встреч;
- базовое расписание вне работы;
- персональные Actions и Interceptors NPC;
- границу между NPC, POI slots, характеристиками и визуальными assets.

Runtime-размещение, occupancy, наложение рабочего расписания, обновление `timesMet`, выбор изображения и interaction state вынесены в `interaction-runtime-engine-questions.md`.

---

## 1. Расположение и хранение initial-данных

```text
src/data/initial/
  npcs.ts
```

NPC доступны через единый registry:

```ts
export const INITIAL_NPCS: Record<NpcId, InitialNpc>;
```

`NpcId` является ключом registry, поэтому отдельное поле `id` внутри `InitialNpc` не хранится:

```ts
export const INITIAL_NPCS = {
  bob: {
    name: 'Bob',
  },
} satisfies Record<NpcId, InitialNpc>;
```

В `npcs.ts` при желании можно оставить краткий комментарий с defaults, но он не является обязательной частью контракта.

Пример заголовка:

```ts
/**
 * Initial NPC defaults:
 * - faction omitted   → NPC не принадлежит фракции
 * - affection omitted → 0
 * - timesMet omitted  → 0
 * - actionIds omitted      → у NPC нет персональных Actions
 * - interceptorIds omitted → у NPC нет персональных Interceptors
 */
```

---

## 2. Initial-тип NPC

```ts
export type NpcBaseScheduleState =
  | 'freeTime'
  | 'home'
  | 'hidden';

export type NpcBaseSchedule = Record<
  TimeOfDay,
  NpcBaseScheduleState
>;

export interface InitialNpc {
  name: string;

  faction?: FactionId;
  affection?: number;
  timesMet?: number;

  baseSchedule: NpcBaseSchedule;

  actionIds?: ActionId[];
  interceptorIds?: InterceptorId[];
}
```

`baseSchedule` является обязательным полным объектом и явно содержит все шесть `TimeOfDay`. Остальные optional-поля нормализуются при создании runtime NPC.

---

## 3. Идентичность и фракция

`name` и `faction` являются базовыми данными личности NPC:

```ts
name: 'Bob';
faction: 'independents';
```

`faction` остаётся optional:

```text
faction отсутствует       → NPC действительно не принадлежит фракции
faction: 'independents'   → NPC относится к явно созданной фракции independents
```

Отсутствие `faction` не превращается автоматически в `independents`. Это два разных состояния. Сам definition фракции `independents` должен быть создан отдельно вместе с остальными faction definitions.

Характеристики, боевой билд и параметры члена команды не входят в `InitialNpc`. Для NPC, который вступает в команду либо участвует в бою, используются отдельные character/stat templates. Форма ссылки на такой template будет определена вместе с боевой и партийной моделью и пока в `InitialNpc` не добавляется.

---

## 4. Affection

```ts
affection?: number;
```

Семантика initial-поля:

```text
affection отсутствует → начальное значение 0
affection указано     → явно заданное начальное отношение к игроку
```

Текущий рабочий диапазон — `-100..100`. Границы рассматриваются как soft limits и могут быть изменены позднее, поэтому в initial-типе остаётся обычный `number`, а жёсткий clamp на уровне структуры данных не вводится.

---

## 5. Times met

```ts
timesMet?: number;
```

Поле заменяет отдельный флаг знакомства:

```text
timesMet отсутствует → 0
timesMet === 0       → игрок ещё не встречался с NPC
timesMet > 0         → NPC уже знаком игроку
```

`isKnown` не хранится: при необходимости он выводится из `timesMet > 0`.

В runtime `timesMet` обновляется при выходе из взаимодействия с NPC в недочерний контекст, но не чаще одного раза за календарный день. Для проверки используется `lastDateMet`; отдельная дневная map не требуется. Простое присутствие NPC в occupancy встречей не считается.

Положительное initial-значение позволяет создать NPC, с которым игрок уже был знаком до начала игры.

---

## 6. Base schedule

`baseSchedule` описывает состояние NPC вне наложенной работы:

```ts
baseSchedule: {
  late_night: 'home',
  early_morning: 'home',
  morning: 'freeTime',
  afternoon: 'freeTime',
  evening: 'freeTime',
  night: 'home',
},
```

Допустимые значения:

```text
freeTime → NPC может занимать freeTime slot
home     → NPC может занимать home slot
hidden   → NPC нигде не размещается
```

`work` намеренно отсутствует в `NpcBaseScheduleState`. Работа задаётся не самим NPC, а его присутствием в `npcIds` рабочего slot конкретного POI. Когда рабочий POI открыт, работа накладывается поверх соответствующего значения `baseSchedule` при построении resolved schedule.

Поэтому NPC initial-объект не хранит:

```text
workplaceId
workSlotId
role
homePoiId
currentPoiId
currentSlotId
```

Источник связи NPC с работой, домом и местами свободного времени — slots соответствующих POI.

---

## 7. Персональные Actions и Interceptors

```ts
actionIds?: ActionId[];
```

Здесь находятся только действия, принадлежащие самому NPC независимо от текущего места и роли:

```ts
actionIds: [
  'bob:askAboutPast',
  'npc:compliment',
],
```

Граница источников Actions:

```text
NPC actionIds       → персональные действия NPC
slot actionIds      → действия NPC в конкретной роли
POI actionIds       → общие возможности места
quest action map    → активные квестовые действия NPC или POI
Frame actionIds     → локальные действия конкретного Frame
```

Порядок runtime-композиции этих источников определяется отдельно и не усложняет `InitialNpc`.

```ts
interceptorIds?: InterceptorId[];
```

Здесь находятся автоматические события, принадлежащие самому NPC независимо от его текущего места и роли: например, первое представление Боба. Они собираются отдельно от Actions и не появляются в списке кнопок.

---

## 8. Связь с POI slots

NPC не знает своё текущее место работы или проживания. POI template содержит slots:

```ts
{
  id: 'bartender',
  role: 'bartender',
  npcIds: ['bob'],
  actionIds: ['bartender:askRumors'],
  interceptorIds: ['redBoar/bartender:shiftGreeting'],
}
```

Семантика `npcIds`:

```text
[]                → slot не может занять никто
[npcId]           → фиксированный кандидат или назначенный NPC
[npcA, npcB, ...] → один occupant случайно выбирается из подходящих кандидатов
```

`role` принадлежит slot, а не NPC. Один NPC может иметь разные роли в разных slots, не меняя свой initial-объект.

`actionIds` и `interceptorIds` slot принадлежат именно этой роли и этому месту. Slot не является `QuestTargetId`: квестовые привязки по владельцам используют конкретный `npcId` или `poiId`. Если автоматическое квестовое событие должно происходить только в конкретном slot, его ID можно держать в `slot.interceptorIds`, а актуальность проверять квестовыми `conditions` самого Interceptor.

Построенные комнаты базы используют ту же структуру slots, что и остальные POI. Назначить NPC в slot построенной комнаты означает записать один ID в runtime-копию `slot.npcIds`. Отдельная сущность `workAssignment` не вводится.

Фактическое текущее размещение хранится в occupancy slice и не входит в `InitialNpc`.

---

## 9. Визуальные данные

В `InitialNpc` пока не добавляются:

```text
image
imageUrl
directory
visualSet
visualId
```

Визуальные assets и правила выбора варианта существуют отдельно от initial NPC registry. По умолчанию визуальная запись разрешается по `npcId`, поэтому поле вида `visualSet: 'bob'` только дублировало бы ключ NPC.

В проекте на Vite отдельные assets подключаются статическими imports, а группы вариантов могут собираться через `import.meta.glob`. Результатом asset import является разрешённая Vite строка URL; сырой путь к папке внутри `InitialNpc` не хранится.

Выбор изображения может позднее учитывать:

```text
npcId
role текущего slot
броню или экипировку
состояние и повреждения
настроение или отношение
```

Точная структура visual registry, имена файлов и приоритет вариантов относятся к runtime/presentation resolver и пока не зафиксированы. Если нескольким NPC действительно понадобится один общий визуальный набор, можно будет добавить semantic-ссылку `visualId`; сейчас этого поля нет.

---

## 10. Полный пример

```ts
/**
 * Initial NPC defaults:
 * - faction omitted   → NPC не принадлежит фракции
 * - affection omitted → 0
 * - timesMet omitted  → 0
 * - actionIds omitted      → у NPC нет персональных Actions
 * - interceptorIds omitted → у NPC нет персональных Interceptors
 */
export const INITIAL_NPCS = {
  bob: {
    name: 'Bob',
    faction: 'independents',

    baseSchedule: {
      late_night: 'home',
      early_morning: 'home',
      morning: 'freeTime',
      afternoon: 'freeTime',
      evening: 'freeTime',
      night: 'home',
    },

    actionIds: [
      'bob:askAboutPast',
      'npc:compliment',
    ],

    interceptorIds: [
      'bob:introduction',
    ],
  },

  lena: {
    name: 'Lena',
    faction: 'independents',

    baseSchedule: {
      late_night: 'home',
      early_morning: 'home',
      morning: 'freeTime',
      afternoon: 'freeTime',
      evening: 'freeTime',
      night: 'home',
    },

    actionIds: [
      'npc:compliment',
    ],
  },

  carl: {
    name: 'Carl',

    baseSchedule: {
      late_night: 'home',
      early_morning: 'home',
      morning: 'freeTime',
      afternoon: 'freeTime',
      evening: 'freeTime',
      night: 'freeTime',
    },

    affection: -10,
    timesMet: 1,
  },
} satisfies Record<NpcId, InitialNpc>;
```

Работа Bob и Lena в таверне не дублируется здесь. Она определяется `npcIds` рабочих slots таверны и её расписанием открытия.

---

## 11. Зафиксировано и отложено

Зафиксировано:

- NPC хранятся в `INITIAL_NPCS`, предварительно как registry `Record<NpcId, InitialNpc>` без поля `id` внутри объекта;
- `name` и полный `baseSchedule` обязательны;
- `faction` optional; отсутствие означает отсутствие фракции, а не автоматический fallback `independents`;
- `affection` по умолчанию равен `0`, текущий рабочий диапазон — `-100..100`;
- `timesMet` по умолчанию равен `0` и заменяет отдельный `isKnown`;
- `baseSchedule` содержит только `freeTime | home | hidden`; состояния `work` в нём нет;
- работа, роль и допустимое размещение задаются POI slots;
- `actionIds` NPC содержат только его персональные Actions, а `interceptorIds` — персональные автоматические события;
- характеристики NPC находятся в отдельных character/stat templates;
- визуальные assets и их resolver отделены от `InitialNpc`;
- поля `visualSet` сейчас нет; визуальная запись по умолчанию находится по `npcId`;
- построенные комнаты базы используют ту же slot-модель без отдельной системы назначений;

Отложено:

- точное поведение soft limits `affection` и возможное изменение диапазона;
- форма связи NPC с отдельным character/stat template;
- точная структура visual registry и resolver;
- правила выбора visual variant по роли, экипировке, состоянию и настроению;
- необходимость `visualId`, если появятся общие визуальные наборы;
- окончательная структура runtime resolved schedules и occupancy.
