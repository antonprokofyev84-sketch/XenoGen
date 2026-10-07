# Initial POI Data Design

## Статус и область документа

Документ фиксирует две связанные структуры данных POI и правила их объединения при создании runtime:

- компактные placement-записи экземпляров в `INITIAL_POIS_BY_CELL`;
- отдельную базу `POI_TEMPLATES` с описанием механики POI.

Клетки описаны отдельно. Локальные slots больше не являются POI и существуют только внутри обычного POI.

---

## 1. Расположение initial-данных

```text
src/data/initial/
  cells.ts
  pois.ts

src/data/
  poiTemplates.ts
```

```ts
export const INITIAL_CELLS = [...];
export const INITIAL_POIS_BY_CELL = {...};
export const POI_TEMPLATES = {...};
```

В начале initial-файла при желании можно разместить краткий комментарий с наиболее важными defaults. Он полезен как локальная подсказка, но не является обязательной частью контракта: нормативное поведение задаётся типами, нормализатором и этим документом.

Пример заголовка `pois.ts`:

```ts
/**
 * Initial POI defaults:
 * - details.isDiscovered omitted      → false
 * - details.explorationThreshold      → template value, otherwise 0
 * - details.lifetimeDaysLeft          → template value, otherwise null
 * - details.faction                   → template value, otherwise undefined
 * - details.visitedTimes omitted      → 0
 * - details.lastTimeVisited omitted   → null
 * - details.isEntryDisabled omitted   → false
 * - details.entryDisabledDaysLeft omitted → временной блокировки нет
 */
```

```ts
export const INITIAL_POIS_BY_CELL = {
  '3-1': [
    // Все initial POI, принадлежащие root cell 3-1.
  ],
} satisfies Partial<Record<CellId, InitialPoi[]>>;
```

Ключ группы однозначно задаёт `rootCellId`. В initial POI поле `rootCellId` не записывается; его добавляет инициализатор.

Пустые группы клеток не указываются. `INITIAL_POIS_BY_CELL` отвечает за размещение и начальное состояние конкретных экземпляров. `POI_TEMPLATES` хранит переиспользуемое либо уникальное механическое описание POI. Нарратив, Frames и presentation хранятся отдельно от POI templates.

---

## 2. Идентичность и топология POI

```ts
interface InitialPoi {
  id: PoiId;
  templateId: PoiTemplateId;
  parentId: CellId | PoiId;
  details: InitialPoiDetails;
}
```

Смысл полей:

```text
id         → ID конкретного экземпляра POI
templateId → ключ definition в POI_TEMPLATES
parentId   → ID непосредственного родителя: клетки или другого POI
details    → начальное состояние и instance-specific данные
```

Поле `type` удаляется. Структурное различие Cell/POI определяется через `parentId`, а связь обычного POI с контентом задаётся явным `templateId`.

`templateId` не означает, что каждый POI создаётся из общего шаблона категории вроде `tavern`. Для уникального авторского POI это ключ его единственного контентного описания:

```ts
{
  id: 'redBoar',
  templateId: 'redBoar',
}
```

Переиспользуемые templates нужны главным образом для процедурных POI и encounters. В этом случае несколько экземпляров действительно могут ссылаться на одно описание:

```ts
{
  id: '3-0_encounter_042',
  templateId: 'scavenger_group',
}
```

Таким образом, `templateId` — не тип POI, а ссылка на отдельный definition. Для уникального POI этот definition описывает один конкретный объект. Для процедурного POI один definition может использоваться множеством экземпляров.

Граница ответственности:

```text
INITIAL_POIS_BY_CELL
→ где расположен экземпляр
→ как он называется в runtime (`id`)
→ каково его начальное instance-state (`details`)

POI_TEMPLATES
→ расписание
→ общие actions
→ общие interceptors
→ NPC slots
→ региональные modifiers/overrides
→ onDayPass

отдельная narrative-система
→ Frames
→ тексты
→ изображения и presentation
```

При инициализации placement-запись и найденный по `templateId` definition объединяются в runtime POI. Сам template при этом не мутируется.

```text
Cell        → parentId === null
обычный POI → parentId: string
```

Инициализация выполняется в два прохода, поэтому порядок POI внутри массива не важен:

1. Создать все runtime POI и добавить каждому `rootCellId` из ключа `INITIAL_POIS_BY_CELL`.
2. Пройти по созданным POI и добавить каждый ID в `childPoiIds` его непосредственного родителя.

В `childPoiIds` входят только непосредственные дети, а не все потомки. Ссылочная целостность `parentId`/`templateId`, отсутствие циклов и остальные authoring-инварианты проверяются единым development-валидатором из `validation-contract.md`; runtime initializer не исправляет данные молча.

---

## 3. Details и defaults

```ts
export type RemainingDays = number | null;

export interface InitialPoiDetails {
  isDiscovered?: true;

  explorationThreshold?: number;
  lifetimeDaysLeft?: RemainingDays;

  faction?: FactionId;

  visitedTimes?: number;
  lastTimeVisited?: number | null;

  // Блокировка входа; семантика в tension-force-exit-and-poi-entry.md
  isEntryDisabled?: true;
  entryDisabledDaysLeft?: number;
}

export type PoiTemplateDetails = Partial<
  Pick<InitialPoiDetails, 'explorationThreshold' | 'lifetimeDaysLeft' | 'faction'>
>;
```

Правила initial-данных:

```text
isDiscovered отсутствует         → false
isDiscovered: true               → POI открыт изначально
explorationThreshold отсутствует → значение template, иначе 0
lifetimeDaysLeft отсутствует     → значение template, иначе null
faction отсутствует              → значение template, иначе POI не принадлежит фракции
visitedTimes отсутствует         → 0
lastTimeVisited отсутствует      → null
isEntryDisabled отсутствует      → false (вход разрешён)
entryDisabledDaysLeft отсутствует → блокировка не активна
```

В initial-записи `isDiscovered` имеет тип `isDiscovered?: true`: отсутствие поля однозначно означает `false`, а явно указывается только редкое начальное состояние `true`. Писать `isDiscovered: false` в initial-данных не нужно.

В runtime `isDiscovered` остаётся обязательным `boolean`; `undefined` существует только до нормализации initial-данных.

`explorationThreshold` optional только в initial-данных. После нормализации runtime-поле обязательно и всегда содержит число.

```ts
export interface PoiDetails {
  isDiscovered: boolean;
  explorationThreshold: number;
  lifetimeDaysLeft: RemainingDays;

  faction?: FactionId;

  visitedTimes: number;
  lastTimeVisited: number | null;

  isEntryDisabled?: true;
  entryDisabledDaysLeft?: number;
}
```

Пример defaults:

```ts
export const DEFAULT_POI_DETAILS: Omit<PoiDetails, 'faction'> = {
  isDiscovered: false,
  explorationThreshold: 0,
  lifetimeDaysLeft: null,
  visitedTimes: 0,
  lastTimeVisited: null,
};
```

Optional access fields намеренно отсутствуют в `DEFAULT_POI_DETAILS`: `undefined` означает разрешённый вход и отсутствие временной блокировки. Они копируются из initial placement только при наличии.

`isDiscovered` принадлежит конкретному экземпляру и не задаётся в template. Инициализатор превращает отсутствующее значение в `false`.

`lastTimeVisited` обновляется при выходе из POI, а не при входе. `visitedTimes` увеличивается при таком выходе не чаще одного раза за календарный день: если `lastTimeVisited` уже относится к текущему дню, повторный выход счётчик не увеличивает.

```text
visitedTimes === 0 → lastTimeVisited === null
visitedTimes > 0   → lastTimeVisited содержит время последнего выхода
```

---

## 4. Общая семантика оставшихся дней

`lifetimeDaysLeft` POI и `explorationDaysLeft` клетки используют один тип:

```ts
export type RemainingDays = number | null;
```

```text
null → состояние постоянно и не уменьшается
0    → срок закончился
N>0  → осталось N дней
```

Общий helper:

```ts
export function decreaseRemainingDays(days: RemainingDays): RemainingDays {
  if (days === null) return null;

  return Math.max(0, days - 1);
}
```

Различаются только initial-defaults:

```text
explorationDaysLeft клетки отсутствует → 0, клетка не разведана
lifetimeDaysLeft POI отсутствует        → null, POI постоянный
```

Для POI:

```text
lifetimeDaysLeft === null → POI постоянный
lifetimeDaysLeft === 0    → POI должен быть удалён
lifetimeDaysLeft > 0      → временный POI
```

В initial placement и template разрешены только `null` либо положительное целое число. Значение `0` является runtime-состоянием, возникающим после уменьшения счётчика; такой POI немедленно рекурсивно помечается на удаление. Development-валидатор отклоняет initial/template `lifetimeDaysLeft: 0`, отрицательные и дробные значения, чтобы истёкший POI не успел выполнить лишний `onDayPass`.

`null` используется вместо `Infinity`, чтобы значение корректно сохранялось через JSON.

---

## 5. Расписание открытия

Расписание является частью template definition, а не placement-записи:

```ts
export type PoiScheduleState = 'open' | 'closed';
export type PoiSchedule = Record<TimeOfDay, PoiScheduleState>;

schedule?: PoiSchedule;
```

Семантика:

```text
schedule отсутствует → POI открыт всегда
schedule указан      → состояние берётся из текущего time slot
```

Если `schedule` указан, он явно содержит все шесть time slots.

Пример:

```ts
schedule: {
  late_night: 'closed',
  early_morning: 'closed',
  morning: 'open',
  afternoon: 'open',
  evening: 'open',
  night: 'open',
},
```

`isOpen` в runtime не хранится: оно вычисляется из текущего time slot и `schedule`.

При инициализации `schedule` копируется из template в runtime POI. Поэтому постоянное изменение runtime-расписания может заменить отдельные значения или весь объект, не мутируя исходный template. Отдельный механизм временного schedule override пока не вводится.

Наличие работников не влияет на открытие. `managerIds` отсутствует: POI открыт всегда, когда открыт по расписанию.

Расписание участвует и в симуляции NPC:

- `work` slots заполняются только когда POI открыт;
- закрытый POI не резервирует и не заполняет `work` slots; NPC с текущим `baseSchedule: 'work'` при этом остаётся неразмещённым, а не переходит в `freeTime/home`;
- Фактическая occupancy остаётся lazy: невходимый POI не получает occupants и не делает chance rolls. Однако рабочая допустимость строится глобально. NPC рассматривается work slot только когда его собственный `baseSchedule` в текущем time slot равен `work`, он связан со slot через candidate/assignment и POI открыт. Такой NPC заранее исключён из `freeTime` и `home`; рабочий POI как бы резервирует его до посещения, но конкретный occupant slot выбирается и кешируется только при входе игрока. Если подходящего открытого work slot нет либо chance не дал occupancy, NPC остаётся неразмещённым без fallback.

---

## 6. Закрытый POI и root Frame

Root Frame POI определяется автоматически по его `templateId` и не записывается в POI definition:

```text
POI root  → templateId, например redBoar
slot root → templateId/slotId, например redBoar/bartender
```

Суффикс `root` не используется. Полная грамматика `FrameId` описана отдельно в initial-дизайне Frames.

На первом этапе отдельный closed Frame не используется. Проверка расписания выполняется до `travelToPoi`:

```text
POI открыт  → переход доступен
POI закрыт  → переход остаётся видимым, но disabled и помечен «Закрыто»
```

Interaction с закрытым POI не начинается, игрок остаётся у parent POI. Закрытый POI не заполняет `work` slots.

Отдельный closed Frame, взлом, проникновение и кража могут быть добавлены позднее. Для будущего closed Frame зарезервирован ID `templateId:closed`, например `redBoar:closed`; структура POI definition при этом не меняется.

---

## 7. Actions POI

Template содержит IDs общих действий этого места:

```ts
actionIds?: ActionId[];
```

Пример:

```ts
actionIds: [
  'redBoar:rest',
  'redBoar:trade',
  'redBoar:buyDrink',
],
```

Используется название `actionIds`, потому что массив содержит ссылки, а не Action objects.

Общие сервисы POI находятся здесь. Возможности NPC, зависящие от занимаемой роли, находятся в соответствующем slot.

Runtime сохраняет Actions отдельными группами по источнику: Frame, POI, slot, personal NPC и quest. Обычное возвращение к родителю, переходы к обнаруженным дочерним POI и вход в занятые NPC slots являются runtime-derived navigation options, а не авторскими Action IDs. Авторский Action используется, когда переходу нужны собственные narrative, check, cost или effects.

Template также может содержать базовые автоматические события входа в конкретный POI:

```ts
interceptorIds?: InterceptorId[];
```

Они собираются отдельно от `actionIds` и обрабатываются очередью Interceptors до показа обычного root.

---

## 8. NPC slots

Slots являются внутренней структурой template definition и группируются по назначению:

```ts
export interface InitialNpcSlots {
  work?: InitialNpcSlot[];
  freeTime?: InitialNpcSlot[];
  home?: InitialNpcSlot[];
}
```

Пустые группы не указываются:

```ts
npcSlots: {
  work: [...],
  freeTime: [...],
}
```

Не нужно писать:

```ts
home: [];
```

Slot definition:

```ts
export interface InitialNpcSlot {
  id: SlotId;
  role: string;
  candidateNpcIds: NpcId[];

  chance?: number;
  actionIds?: ActionId[];
  interceptorIds?: InterceptorId[];
}
```

Смысл:

```text
id              → локальный ID slot внутри POI
role            → роль NPC в этом slot
candidateNpcIds → immutable NPC-кандидаты для автоматического заполнения
chance          → вероятность автоматического заполнения, диапазон 0..1
actionIds       → действия NPC именно в этой роли
interceptorIds → автоматические события входа именно в этот slot
```

Все вероятности в данных используют диапазон `0..1`:

```ts
chance: 0.7;
```

Правила разрешения occupancy:

```text
chance отсутствует       → 1
candidateNpcIds: []      → без runtime assignment slot не может занять никто
приоритет групп          → work > freeTime > home
несколько кандидатов slot → случайный выбор
```

Алгоритм намеренно простой:

1. Последовательно обойти группы `work`, `freeTime`, `home`.
2. Внутри каждой группы обойти slots в порядке массива.
3. Если есть runtime assignment, проверить назначенного NPC. Совместимый со schedule и свободный NPC занимает slot без `chance`; иначе slot остаётся пустым.
4. Если assignment нет, бросить `chance` и случайно выбрать одного подходящего и ещё не занятого NPC из `candidateNpcIds`.
5. Перейти к следующему slot.

Первый обработанный slot получает преимущество. Поэтому, если один NPC подходит нескольким slots одинакового приоритета, он занимает первый подходящий slot по порядку массива и больше не рассматривается. Никакого дополнительного оптимального распределения нет.

Один NPC не может одновременно занимать несколько slots или иметь две работы. Static `candidateNpcIds` допускают NPC максимум в одном work slot; runtime work assignment supersedes static work membership. Выбранный occupant сохраняется до следующего time slot; пересчёт внутри одного time slot не выполняется.

`role` принадлежит slot, а не NPC. Для рабочего slot это работа NPC; в остальных группах это его локальная роль. Помимо role-specific Actions значение `role` может передаваться отдельному visual resolver, но сами изображения в slot не хранятся.

Slot-owned `actionIds` и `interceptorIds` являются базовым контентом конкретного slot. Slot не входит в `QuestTargetId`: квестовые `actionIdsByTarget` и `interceptorIdsByTarget` используют только конкретный `npcId` или `poiId`. Если квестовый Interceptor должен работать только в одном slot, его ID хранится в `slot.interceptorIds`, а квестовая актуальность задаётся `conditions` самого Interceptor.

Семантика `candidateNpcIds` одинакова для всех POI:

```text
[]                → slot не получает automatic occupant
[npcId]           → один допустимый automatic candidate
[npcA, npcB, ...] → один occupant случайно выбирается из подходящих кандидатов
```

Построенные комнаты базы используют те же slots. Постоянное назначение хранится отдельно от template в runtime map:

```ts
interface RuntimeSlotAssignment {
  assignedNpcId: NpcId;
}

type RuntimeSlotAssignments = Partial<
  Record<PoiId, Partial<Record<SlotId, RuntimeSlotAssignment>>>
>;
```

Присутствующий `assignedNpcId` является эксклюзивным: он не меняет `candidateNpcIds`, при совместимом schedule занимает slot без `chance`, а при недоступности оставляет slot пустым. Обычные candidates не становятся fallback для assignment.

Slots описывают правила заполнения, но не текущих occupants. Фактическое runtime-состояние `slotId → npcId` хранится в occupancy slice.

Предварительная форма runtime occupancy:

```ts
type PoiSlotOccupants = Record<PoiId, Partial<Record<SlotId, NpcId>>>;
```

Во внутреннем `Record<SlotId, NpcId>` присутствуют только занятые slots. Если `slotId` отсутствует, этот slot пуст:

```ts
{
  redBoar: {
    bartender: 'bob',
    // visitor_1 отсутствует → slot пуст
  },
}
```

Окончательная структура occupancy slice не является частью этого документа.

---

## 9. Локальные региональные уровни POI

Клетка хранит реальные значения региональных параметров `0..999`. POI не работает с этими raw values при разрешении своего локального контекста: POI получает уровень клетки и возвращает конечные уровни для своего места.

```ts
export type RegionLevels = Partial<Record<RegionParameterKey, number>>;

export interface PoiTemplateDefinition {
  regionLevelOverrides?: RegionLevels;
  regionLevelModifiers?: RegionLevels;
}
```

Оба объекта могут существовать одновременно, если относятся к разным параметрам:

```ts
regionLevelOverrides: {
  techLevel: 6,
},

regionLevelModifiers: {
  prosperity: 2,
  threat: -1,
},
```

Разрешение выполняется отдельно для каждого параметра:

```text
для параметра есть override → конечным значением становится override
иначе есть modifier         → конечный уровень = уровень root cell + modifier
иначе                       → конечный уровень = уровень root cell
```

Если один параметр присутствует одновременно в override и modifier, override имеет приоритет, а modifier для этого параметра игнорируется.

Примеры использования:

```text
богатый квартал относительно города → prosperity modifier +2
бродячий торговец с устойчивым ассортиментом → techLevel/prosperity override
лаборатория → techLevel override, contamination modifier
```

Вложенный POI пока всегда разрешает параметры непосредственно от `rootCellId`, а не наследует локальные параметры родительского POI.

Уровень клетки всегда является целым числом:

```ts
const cellLevel = Math.floor(rawCellValue / 100);
```

```text
raw value клетки → число 0..999; дробные значения допустимы
уровень          → целое число 0..9
например 20      → уровень 0
```

Для каждого параметра конечный уровень POI определяется так:

```ts
const resolvedLevel =
  regionLevelOverrides?.[param] ?? cellLevel + (regionLevelModifiers?.[param] ?? 0);

const finalLevel = Math.min(9, Math.max(0, resolvedLevel));
```

Overrides и modifiers задаются целыми уровнями и целыми дельтами уровня. Поэтому конечный уровень всегда является целым числом `0..9`, независимо от текущего raw-значения root cell.

TypeScript-тип `number` сам по себе не гарантирует целочисленность. Development-валидатор проверяет, что каждый override является целым числом `0..9`, а каждый modifier — целым числом. Resolver не округляет ошибочные дробные authoring-данные молча.

В будущем можно отдельно рассмотреть наследование по цепочке родителей:

```text
root cell → parent POI → child POI
```

---

## 10. Ежедневные эффекты POI

`onDayPass` хранится в template definition и работает непосредственно с реальными значениями региональных параметров клетки `0..999`, а не с уровнями POI.

Обёртки `triggers` и `do` не используются:

```ts
onDayPass: [
  effect1,
  effect2,
],
```

Тип эффекта:

```ts
export interface ChangeRegionParameterEffect {
  type: 'changeRegionParameter';
  cellParam: RegionParameterKey;
  delta: number;

  chance?: number;
  min?: number;
  max?: number;
}
```

Пример:

```ts
onDayPass: [
  {
    type: 'changeRegionParameter',
    cellParam: 'contamination',
    delta: 1,
    chance: 0.3,
    max: 400,
  },
],
```

Семантика:

```text
delta  → изменение raw value клетки; может быть дробным
chance → независимая вероятность выполнения эффекта, диапазон 0..1
min    → необязательный нижний предел влияния этого эффекта
max    → необязательный верхний предел влияния этого эффекта
```

```text
chance отсутствует → 1
min отсутствует    → 0
max отсутствует    → 999
```

Глобальный диапазон регионального параметра остаётся `0..999`.

Локальный `min`/`max` насыщает изменение на границе, но не должен изменять уже вышедшее за неё значение в обратную сторону:

```text
current 398, delta +5, max 400 → 400
current 500, delta +5, max 400 → 500
current 2, delta -5, min 0     → 0
current 100, delta -5, min 200 → 100
```

Эффект изменяет региональные параметры root cell, содержащей POI. Это следует из контекста POI, поэтому `rootCell` не дублируется в descriptor.

Если проходит несколько дней, `chance` каждого эффекта бросается независимо для каждого прошедшего дня.

В runtime используется `pendingRemoval?: true`. Любая операция пометки POI на удаление сразу рекурсивно помечает всех его потомков. Помеченные узлы считаются завершёнными, не допускают новых взаимодействий и не выполняют `onDayPass`.

POI-часть одного дневного тика:

1. Обойти POI, существовавшие к началу тика. Непосредственно перед `onDayPass` каждого узла повторно проверить `pendingRemoval`; помеченный узел пропустить.
2. После завершения `onDayPass` уменьшить непостоянные `lifetimeDaysLeft` непомеченных POI.
3. Если `lifetimeDaysLeft` достиг `0`, немедленно рекурсивно пометить этот POI и всех его потомков.
4. Физически пока ничего не удалять. Один общий проход удаления выполняется в самом конце полного `onDayEnd`, после квестовых таймеров и применения собранных effects.

Та же общая world-owned фаза `onDayEnd` уменьшает остальные зарегистрированные дневные счётчики, включая `explorationDaysLeft` клетки и `entryDisabledDaysLeft` POI. Для временной блокировки значение `1` удаляется на ближайшем конце дня; отдельный pipeline для каждого нового счётчика не создаётся.

Поэтому временный POI с `lifetimeDaysLeft: 1` успевает выполнить эффекты своего последнего дня. Если родитель помечен заранее или во время ещё не завершённого обхода, его уже помеченные потомки дневные effects не выполняют. Новые POI, созданные во время текущего `onDayEnd`, не входят в начальный список и начнут участвовать в симуляции со следующего дня.

`isDiscovered` не останавливает `onDayPass`: скрытый от игрока POI продолжает участвовать в симуляции. Удалённый POI уже отсутствует в runtime-коллекции и в следующих тиках не участвует. `onEnter` не добавляется, пока не появится конкретная механика, которой он нужен.

---

## 11. Предварительные initial-типы

```ts
export type RemainingDays = number | null;
export type RegionLevels = Partial<Record<RegionParameterKey, number>>;
export type PoiScheduleState = 'open' | 'closed';
export type PoiSchedule = Record<TimeOfDay, PoiScheduleState>;

export interface InitialPoiDetails {
  isDiscovered?: true;
  explorationThreshold?: number;
  lifetimeDaysLeft?: RemainingDays;
  faction?: FactionId;
  visitedTimes?: number;
  lastTimeVisited?: number | null;
  isEntryDisabled?: true;
  entryDisabledDaysLeft?: number;
}

export interface InitialNpcSlot {
  id: SlotId;
  role: string;
  candidateNpcIds: NpcId[];
  chance?: number;
  actionIds?: ActionId[];
  interceptorIds?: InterceptorId[];
}

export interface InitialNpcSlots {
  work?: InitialNpcSlot[];
  freeTime?: InitialNpcSlot[];
  home?: InitialNpcSlot[];
}

export interface ChangeRegionParameterEffect {
  type: 'changeRegionParameter';
  cellParam: RegionParameterKey;
  delta: number;
  chance?: number;
  min?: number;
  max?: number;
}

export interface InitialPoi {
  id: PoiId;
  templateId: PoiTemplateId;
  parentId: CellId | PoiId;

  details: InitialPoiDetails;
}

export interface PoiTemplateDefinition {
  details?: PoiTemplateDetails;

  schedule?: PoiSchedule;
  actionIds?: ActionId[];
  interceptorIds?: InterceptorId[];
  npcSlots?: InitialNpcSlots;

  regionLevelOverrides?: RegionLevels;
  regionLevelModifiers?: RegionLevels;

  onDayPass?: ChangeRegionParameterEffect[];
}

export type PoiTemplateMap = Record<PoiTemplateId, PoiTemplateDefinition>;
```

`details` объединяются отдельно:

```ts
const runtimeDetails = normalizePoiDetails({
  ...template.details,
  ...initialPoi.details,
});
```

То есть template может дать начальные `faction`, `explorationThreshold` и `lifetimeDaysLeft`, а конкретная placement-запись может их переопределить. `isDiscovered`, `isEntryDisabled`, `entryDisabledDaysLeft`, `visitedTimes` и `lastTimeVisited` принадлежат экземпляру. Отсутствующий `isDiscovered` нормализуется в обязательный runtime `false`; optional access fields остаются отсутствующими, потому что `undefined` уже означает разрешённый вход. Остальные поля definition не дублируются в placement-записи.

---

## 12. Полный пример

```ts
export const INITIAL_POIS_BY_CELL = {
  '3-0': [
    {
      id: '3-0_encounter_000',
      templateId: 'scavenger_group',
      parentId: '3-0',

      details: {
        isDiscovered: true,
      },
    },
  ],

  '3-1': [
    {
      id: 'dustTown',
      templateId: 'dustTown',
      parentId: '3-1',

      details: {
        isDiscovered: true,
      },
    },

    {
      id: 'redBoar',
      templateId: 'redBoar',
      parentId: 'dustTown',

      details: {
        isDiscovered: true,
      },
    },

    {
      id: 'smallMutantNest',
      templateId: 'mutant_nest',
      parentId: 'dustTown',

      details: {
        lifetimeDaysLeft: 10,
        // isDiscovered отсутствует → false
      },
    },
  ],
} satisfies Partial<Record<CellId, InitialPoi[]>>;
```

Отдельная база definitions:

```ts
export const POI_TEMPLATES = {
  dustTown: {},

  redBoar: {
    details: {
      faction: 'settlers',
    },

    schedule: {
      late_night: 'closed',
      early_morning: 'closed',
      morning: 'open',
      afternoon: 'open',
      evening: 'open',
      night: 'open',
    },

    actionIds: ['redBoar:rest', 'redBoar:trade', 'redBoar:buyDrink'],

    npcSlots: {
      work: [
        {
          id: 'bartender',
          role: 'bartender',
          candidateNpcIds: ['bob'],
          actionIds: ['bartender:askRumors'],
        },
        {
          id: 'waitress',
          role: 'waitress',
          candidateNpcIds: ['lena'],
          actionIds: ['waitress:askRumors'],
        },
      ],

      freeTime: [
        {
          id: 'visitor_1',
          role: 'visitor',
          candidateNpcIds: ['carl', 'mara'],
          chance: 0.7,
          actionIds: ['visitor:buyDrink', 'visitor:askRumors'],
        },
      ],
    },

    regionLevelOverrides: {
      techLevel: 4,
    },

    regionLevelModifiers: {
      prosperity: 1,
    },
  },

  mutant_nest: {
    details: {
      explorationThreshold: 40,
      faction: 'mutants',
    },

    regionLevelModifiers: {
      contamination: 2,
    },

    onDayPass: [
      {
        type: 'changeRegionParameter',
        cellParam: 'contamination',
        delta: 1,
        chance: 0.3,
        max: 400,
      },
    ],
  },

  scavenger_group: {
    details: {
      faction: 'scavengers',
      lifetimeDaysLeft: 5,
    },
  },
} satisfies PoiTemplateMap;
```

`redBoar` имеет собственный definition, используемый одним авторским POI. `scavenger_group` является настоящим переиспользуемым template: новые encounters получают разные `id`, `parentId` и instance-state, но используют одно описание.

---

## 13. Зафиксировано и отложено

Зафиксировано:

- `INITIAL_POIS_BY_CELL` содержит компактные placement-записи экземпляров;
- `POI_TEMPLATES` отдельно содержит механику POI; narrative/content/presentation хранятся в narrative-системе;
- при создании runtime POI placement объединяется с definition, найденным по `templateId`;
- `type` удалён, используется обязательный `templateId` контентного описания;
- для уникального POI `templateId` обычно совпадает с `id`; общие templates переиспользуются преимущественно procedural/encounter POI;
- `rootCellId` вычисляется из ключа группы;
- `parentId` хранится явно;
- `childPoiIds` строится двухпроходным инициализатором и содержит непосредственных детей;
- initial `isDiscovered` имеет тип `isDiscovered?: true`: отсутствие означает `false`, явно записывается только `true`, а в runtime поле всегда является обязательным `boolean`;
- `isEntryDisabled?: true` и `entryDisabledDaysLeft?: number` принадлежат instance details; отсутствие означает разрешённый вход, а временной счётчик уменьшается общей фазой `onDayEnd` и удаляется при достижении нуля;
- `explorationThreshold` получает default `0`;
- отсутствие `lifetimeDaysLeft` означает постоянный POI; указанное initial/template значение может быть только положительным целым числом, а `0` возникает только в runtime перед пометкой на удаление;
- расписание хранится в template как полный `schedule`, копируется в runtime и может быть там постоянно изменено;
- root Frame POI имеет ID, равный `templateId`; root Frame slot имеет ID `templateId/slotId`; суффикс `root` не используется;
- проверка расписания выполняется до перемещения; закрытый переход disabled и отдельный closed Frame на первом этапе не используется;
- закрытый POI не резервирует и не заполняет `work` slots; рабочее состояние NPC не получает fallback в другие группы;
- `managerIds` отсутствует;
- общие действия POI хранятся в `actionIds`, а базовые автоматические события входа — в `interceptorIds` template definition;
- slots группируются по `work/freeTime/home`, пустые группы не указываются;
- defaults slots: `chance = 1`, пустой `candidateNpcIds` запрещает automatic placement;
- `role` и immutable `candidateNpcIds` принадлежат template slot; candidates не являются persistent assignments;
- построенные комнаты базы используют отдельные `RuntimeSlotAssignments`, не изменяющие template candidates;
- slots разрешаются последовательно: `work > freeTime > home`, затем в порядке массивов; первый подходящий slot получает случайного свободного кандидата;
- фактические occupants slots хранятся в occupancy slice;
- raw региональные параметры являются числами `0..999` и могут быть дробными; static POI modifiers/overrides проходят development-проверку целочисленности, а итог всегда ограничивается целым диапазоном `0..9`;
- override имеет приоритет только для совпадающего параметра;
- `onDayPass` работает с raw values клетки и хранится прямым массивом в template definition;
- пометка POI на удаление сразу рекурсивно помечает всё его поддерево; помеченные узлы не выполняют `onDayPass`, а физическое удаление всех помеченных POI происходит одним общим проходом в конце `onDayEnd`;
- `isDiscovered` управляет видимостью для игрока и не влияет на global resolved schedule NPC; actual slot occupancy при этом создаётся лениво только для POI, в который вошёл игрок;
- вложенный POI пока разрешает региональные параметры непосредственно от root cell.

Отложено:

- окончательная внутренняя структура runtime occupancy slice при сохранении утверждённых template/assignment/cache слоёв;
- временные изменения расписания;
- наследование региональных параметров по цепочке parent POI;
- конкретные closed-flow сценарии взлома, проникновения и кражи.
