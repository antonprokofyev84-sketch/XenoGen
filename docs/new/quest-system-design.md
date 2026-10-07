# Квестовая система — финальный дизайн статических квестов

## Статус документа

Документ фиксирует согласованный контракт первой версии статических квестов.

Динамические квесты и конкретное устройство runtime-памяти Actions и Interceptors вынесены за рамки этого контракта и будут проектироваться отдельно.

Новая механика, ограничение или защитное правило добавляется только после конкретного игрового сценария, в котором без него возникает реальная проблема.

Для снимка статистики убийств используется отдельный effect `snapshotDefeatedCount`. Универсальный язык чтения произвольных значений из state не вводится.

## 1. Общая модель

- В утверждённую первую версию входят статические квесты, заранее описанные в initial-данных.
- Основной путь прохождения — последовательная смена стадий.
- `initialStage` — начальная стадия квеста до его появления в журнале.
- Actions `initialStage` могут быть доступны так же, как Actions любой другой стадии.
- Отдельный `startQuest` не нужен: переход из `initialStage` в рабочую стадию выполняется обычным `setQuestStage`.
- Жизненный цикл явно хранится в `status: 'initial' | 'active' | 'completed' | 'failed'`.
- Квест продвигается через обычные Actions и их effects. Отдельный квестовый event bus не вводится.
- Квест может предоставлять как Actions, так и Interceptors.
- Для простых параллельных задач используются квестовые переменные.
- Универсальная система `tasks` или `objectives` пока не вводится.
- Журнал не анализирует Actions, `conditions`, `requirements` или `cost`.

## 2. Initial-структура квеста

```ts
type LocalizedText = string;
type ResolvedText = string;

interface QuestTimeLimit {
  days: number;
  onExpire: Effect[];
  showInJournal?: boolean;
}

interface InitialQuest {
  name: LocalizedText;

  /** Основная задача квеста. */
  description: LocalizedText;

  category: QuestCategory;

  /** Если true, квест не показывается в журнале. */
  isHidden?: boolean;

  /** Общий тайм-лимит квеста. */
  timeLimit?: QuestTimeLimit;

  stages: Record<QuestStageId, InitialQuestStage>;
}

interface InitialQuestStage {
  title?: LocalizedText;

  /** Запись, добавляемая в историю квеста при переходе на стадию. */
  description?: LocalizedText;

  /** Тайм-лимит конкретной стадии. */
  timeLimit?: QuestTimeLimit;

  actionIdsByTarget?: Partial<
    Record<QuestTargetId, ActionId[]>
  >;

  interceptorIdsByTarget?: Partial<
    Record<QuestTargetId, InterceptorId[]>
  >;
}
```

Каждый квест содержит стадию с ID `initialStage`.

`QuestTargetId` — конкретный NPC или конкретный POI. `templateId` и внутренний slot не являются владельцами квестовых Actions и Interceptors.

Стадия хранит только привязки по владельцам. Полные определения Actions и Interceptors находятся в соответствующих общих реестрах.

## 3. Runtime квестов

Runtime создаётся сразу для всех initial-квестов, включая ещё не принятые.

```ts
type QuestStatus =
  | 'initial'
  | 'active'
  | 'completed'
  | 'failed';

type QuestVarValue =
  | boolean
  | number
  | string;

interface RunningQuestRuntime {
  status: 'initial' | 'active';

  stageId: QuestStageId;
  isHidden: boolean;
  vars: Record<string, QuestVarValue>;
  journalEntries: ResolvedText[];

  questDaysLeft?: number;
  stageDaysLeft?: number;
}

interface FinishedQuestRuntime {
  status: 'completed' | 'failed';
  isHidden: boolean;
  journalEntries: ResolvedText[];
}

type QuestRuntime =
  | RunningQuestRuntime
  | FinishedQuestRuntime;
```

При создании новой игры:

```ts
{
  status: 'initial',
  stageId: 'initialStage',
  isHidden: definition.isHidden ?? false,
  vars: {},
  journalEntries: [resolveText(definition.description)],
  questDaysLeft: definition.timeLimit?.days,
  stageDaysLeft: definition.stages.initialStage.timeLimit?.days,
}
```

Таким образом:

- пустой объект `vars` существует заранее;
- основная задача уже находится в `journalEntries`, но сам квест ещё скрыт, пока имеет `status: 'initial'`;
- глобальный счётчик квеста можно инициализировать сразу;
- пока квест имеет `status: 'initial'`, глобальный счётчик не уменьшается;
- таймер самой `initialStage`, если он задан, уменьшаться может.

При первом переходе из `initialStage` в рабочую стадию движок одновременно меняет `status` с `initial` на `active`. Отдельного effect для изменения статуса нет.

`completeQuest` и `failQuest` переводят квест соответственно в `completed` или `failed`. Для завершённого квеста сохраняются статус, `isHidden` и история журнала. `stageId`, vars и таймеры удаляются, а квест перестаёт предоставлять Actions и Interceptors. Повторный запуск завершённого или проваленного квеста не поддерживается.

### 3.1 Статические квесты

Статический квест заранее описан в initial-данных. Его runtime создаётся при создании новой игры. После завершения или провала он остаётся в state в компактной форме `FinishedQuestRuntime`, чтобы сохранить статус и историю журнала.

## 4. Стадии и квестовые Actions

### 4.1 Привязка по владельцам

```ts
talkToLena: {
  description: 'Поговорить с Леной.',

  actionIdsByTarget: {
    lena: ['lena:missingCourier:question'],
  },
}
```

`actionIdsByTarget` показывает, какие входные квестовые Actions текущая стадия добавляет конкретным NPC и POI.

Если входной Action открывает Frame, внутренние ответы принадлежат Frame и не перечисляются в стадии квеста.

### 4.2 Кто меняет стадию

Стадию меняет Action, после которого текущая задача действительно выполнена.

Это может быть:

- сам квестовый Action, если действие простое;
- внутренний Action Frame, если квестовый Action только открыл разговор или сцену.

Простой Action может сразу завершить стадию:

```ts
'redBoarCellar:missingCourier:search': {
  label: 'Осмотреть подвал',

  result: {
    effects: [{
      type: 'setQuestStage',
      questId: 'missingCourier',
      stageId: 'reportToMara',
    }],
  },
}
```

### 4.3 Несколько путей прохождения

Одна стадия может предоставлять несколько самостоятельных способов продвижения в разных местах:

```ts
actionIdsByTarget: {
  warehouseGate: [
    'warehouseGate:missingCourier:enter',
  ],

  drainageTunnel: [
    'drainageTunnel:missingCourier:enter',
  ],
}
```

Они могут вести в одну следующую стадию или в разные ветви.

Варианты вроде «Убедить», «Подкупить» и «Угрожать» внутри одного разговора обычно являются Actions внутреннего Frame, а не отдельными привязками стадии.

### 4.4 Пограничные переходы

`setQuestStage` в уже текущую стадию ничего не делает: запись журнала не добавляется повторно, таймер стадии не сбрасывается.

Отдельная механика возврата на ранее пройденную стадию не вводится. Если сюжет снова приводит к похожей задаче, она описывается новой стадией с новым ID, потому что это уже другое состояние квеста.

В одном блоке effects для одного квеста может находиться только один lifecycle-effect: `setQuestStage`, `completeQuest` или `failQuest`. Правило одинаково для `ActionResult.effects`, `InterceptorResult.effects` и `QuestTimeLimit.onExpire`; несколько таких effects являются ошибкой данных квеста.

### 4.5 Квестовые effects первой версии

```ts
type QuestEffect =
  | {
      type: 'setQuestStage';
      questId: QuestId;
      stageId: QuestStageId;
    }
  | {
      type: 'setQuestVar';
      questId: QuestId;
      key: string;
      value: QuestVarValue;
    }
  | {
      type: 'snapshotDefeatedCount';
      questId: QuestId;
      key: string;
      enemyTypeId: EnemyTypeId;
    }
  | {
      type: 'setQuestJournalVisibility';
      questId: QuestId;
      isVisible: boolean;
    }
  | {
      type: 'completeQuest';
      questId: QuestId;
    }
  | {
      type: 'failQuest';
      questId: QuestId;
    };
```

`QuestEffect` входит в общий union `Effect`, используемый `ActionResult.effects`, `InterceptorResult.effects` и `QuestTimeLimit.onExpire`.

Отдельных effects `startQuest` и `setQuestStatus` нет.

`setQuestStage`, `setQuestVar` и `snapshotDefeatedCount` работают только с runtime в состоянии `initial` или `active`. Попытка применить их к `completed` или `failed` является ошибкой данных. `setQuestJournalVisibility` может изменять видимость квеста в журнале в любом status; runtime-поле `isHidden` получает значение `!isVisible`.

## 5. Предложение квеста

Специальный тип Frame для предложения квеста не вводится.

Обычная схема:

1. Action `initialStage` у NPC открывает обычный Frame с описанием поручения.
2. Frame содержит обычные Actions «Принять», «Отказаться» и при необходимости дополнительные вопросы или checks.
3. Action принятия выполняет `setQuestStage` в первую рабочую стадию.
4. Отказ возвращает игрока назад и может оставить квест в `initialStage`, чтобы предложение осталось доступным позднее.

Если отдельное подтверждение не требуется, входной Action может сразу выполнить `setQuestStage`.

## 6. `conditions`, `requirements` и `cost`

Названия `conditions` и `requirements` сохраняются, но должны получить явные комментарии в типах.

Проверка исходников и согласованного action-документа показала, что законченного TypeScript-union `ActionCondition` пока нет. Зафиксированы следующие существующие виды условий:

- `stat`;
- `skill`;
- `item`;
- `defeated`;
- `affection`;
- `reputation`.

Числовые conditions используют `min`, `max` и `exact`; границы включительные, `exact` означает равенство. `conditions` и `requirements` используют один тип и объединяются через AND. Невыполненный `conditions` скрывает Action, невыполненный `requirements` оставляет его видимым, но disabled. OR и NOT в первой версии не вводятся.

Для квеста с отсчётом убийств от момента принятия подтверждена следующая форма расширенного `defeated`:

```ts
interface NumericComparison {
  min?: number;
  max?: number;
  exact?: number;
}

interface QuestVarRef {
  questId: QuestId;
  key: string;
}

interface DefeatedCondition extends NumericComparison {
  type: 'defeated';
  enemyTypeId: EnemyTypeId;
  baselineFromVar?: QuestVarRef;
}
```

Без `baselineFromVar` проверяется общий накопительный счётчик. С `baselineFromVar` проверяемым значением становится:

```ts
currentDefeated - quest.vars[baselineFromVar.key]
```

Пример подтверждённой формы:

```ts
{
  type: 'defeated',
  enemyTypeId: 'raider',
  baselineFromVar: {
    questId: 'huntRaidersForMara',
    key: 'defeatedAtStart',
  },
  min: 10,
}
```

К существующим условиям добавляются два квестовых типа.

```ts
interface QuestVarConditionBase {
  type: 'questVar';
  questId: QuestId;
  key: string;
}

type QuestVarCondition =
  | QuestVarConditionBase & {
      equals: QuestVarValue;
      notEquals?: never;
    }
  | QuestVarConditionBase & {
      notEquals: QuestVarValue;
      equals?: never;
    };

interface QuestStatusCondition {
  type: 'questStatus';
  questId: QuestId;
  status: QuestStatus;
}
```

`equals` и `notEquals` взаимоисключающие. Отсутствующая quest var остаётся обычным `undefined` и не преобразуется в `false`:

```ts
undefined === true // false
undefined !== true // true
```

Поэтому флаг не требуется заранее инициализировать значением `false`. `notEquals` является оператором сравнения конкретного `QuestVarCondition`, а не общей поддержкой логического NOT для всех conditions.

`questStatus` сравнивает status квеста с одним точным значением: `initial`, `active`, `completed` или `failed`.

`QuestVarCondition` и `QuestStatusCondition` должны войти в общий `ActionCondition` рядом с существующими типами условий.

`questStage` в первой версии не вводится: Actions и Interceptors самого квеста уже выбираются через привязки его текущей стадии. Такой condition может понадобиться позднее для зависимости независимого контента от конкретной стадии другого квеста.

Общее условие времени также не вводится. Текущие задачи покрываются расписаниями POI/NPC и квестовыми таймерами. При появлении конкретного сценария можно будет добавить узкий condition вроде `timeSlot`, не вводя заранее абстрактный `time`.

Общие поля Actions и Interceptors:

```ts
type ActionNumber =
  | number
  | ((context: ActionContext) => number);

interface ExecutionLimit {
  perDay?: number;
  total?: number;
}

interface BaseExecutable {
  conditions?: ActionCondition[];
  appearanceChance?: ActionNumber;
  executionLimit?: ExecutionLimit;
}

interface Action extends BaseExecutable {
  requirements?: ActionCondition[];
}
```

`appearanceChance` и `executionLimit` имеют одинаковую форму у Actions и Interceptors. Существующий `maxExecutions` соответствует будущему `executionLimit.perDay`; `executionLimit.total` требует отдельного долговременного счётчика.

Передача предметов описывается через `cost` Action:

```ts
cost: {
  items: [{ itemId: 'food', count: 10 }],
}
```

`cost` проверяет наличие предметов, блокирует Action при нехватке и списывает предметы при выполнении. Дублировать это отдельным condition и effect удаления тех же предметов не нужно.

`ItemCondition` используется, когда предмет нужно только иметь. Если предмет передаётся или расходуется, используется `cost`.

## 7. Квестовые переменные

У каждого квеста есть собственный runtime-объект переменных:

```ts
vars: Record<string, QuestVarValue>;
```

```ts
type QuestVarValue =
  | boolean
  | number
  | string;
```

Объекты и массивы в первой версии не используются. Отсутствие ключа означает `undefined`, но `undefined` не является допустимым `QuestVarValue`.

Обычное присваивание выполняется явным effect:

```ts
{
  type: 'setQuestVar',
  questId: 'missingCourier',
  key: 'askedBob',
  value: true,
}
```

Переменные могут использоваться и в `initialStage`, потому что runtime всех квестов существует с начала игры.

### Простые параллельные задачи

```ts
askWitnesses: {
  description: 'Расспросить Боба и Лену.',

  actionIdsByTarget: {
    bob: ['bob:missingCourier:question'],
    lena: ['lena:missingCourier:question'],
    mara: ['mara:missingCourier:report'],
  },
}
```

После разговоров устанавливаются, например:

```ts
askedBob: true
askedLena: true
```

`requirements` Action отчёта проверяют, что обе переменные установлены в `true`. Actions Боба и Лены скрываются через `notEquals: true` после установки соответствующей переменной.

Например, Action Боба виден, пока флаг не равен `true`:

```ts
conditions: [{
  type: 'questVar',
  questId: 'missingCourier',
  key: 'askedBob',
  notEquals: true,
}]
```

Action отчёта становится доступен после обоих разговоров:

```ts
requirements: [
  {
    type: 'questVar',
    questId: 'missingCourier',
    key: 'askedBob',
    equals: true,
  },
  {
    type: 'questVar',
    questId: 'missingCourier',
    key: 'askedLena',
    equals: true,
  },
]
```

Предварительно записывать `askedBob: false` и `askedLena: false` не требуется.

Установка переменных сама по себе не обязана менять стадию. В этом примере переход явно выполняет Action отчёта.

### Переменные зависимых статических квестов

`setQuestVar` может изменять vars любого существующего статического квеста. Это возможно и до его принятия, потому что runtime всех статических квестов создаётся с начала игры.

Если факт понадобится после завершения текущего квеста, Action заранее записывает его в зависимый квест:

```ts
effects: [
  {
    type: 'setQuestVar',
    questId: 'undergroundRecruitment',
    key: 'lenaAgreed',
    value: true,
  },
  {
    type: 'completeQuest',
    questId: 'missingCourier',
  },
]
```

После завершения `missingCourier` его vars удаляются, но значение в `undergroundRecruitment` сохраняется. Если исходный квест завершается в том же результате, записывать тот же факт ещё и в его собственные vars не требуется.

Такой способ предназначен для явных зависимостей между несколькими статическими квестами. Если один факт станет нужен множеству независимых систем, это будет отдельный постоянный факт мира, а не quest var.

### Снимок накопительной статистики

Для задания «убить N врагов после принятия» используется специализированный effect:

```ts
{
  type: 'snapshotDefeatedCount',
  questId: 'huntRaidersForMara',
  key: 'defeatedAtStart',
  enemyTypeId: 'raider',
}
```

Его семантика:

```ts
quest.vars[key] =
  state.statsSlice.combat.defeated[enemyTypeId] ?? 0;
```

После этого `DefeatedCondition.baselineFromVar` проверяет разницу между текущей статистикой и сохранённым значением. Отдельно увеличивать квестовый счётчик после каждого боя не требуется.

Это намеренно узкий effect для уже возникшей задачи. Отдельные `snapshotItemCount`, `snapshotReputation` или `snapshotMoney` не вводятся: текущие значения предметов, репутации и денег уже проверяются обычными conditions, requirements и cost. Если позже действительно понадобится снимок параметра региона или POI, его контракт будет добавлен по конкретному сценарию.

### Квест «Убить 10 рейдеров»

При принятии задания Action сохраняет только вычисляемое runtime-значение и переводит квест на рабочую стадию:

```ts
result: {
  effects: [
    {
      type: 'snapshotDefeatedCount',
      questId: 'huntRaidersForMara',
      key: 'defeatedAtStart',
      enemyTypeId: 'raider',
    },
    {
      type: 'setQuestStage',
      questId: 'huntRaidersForMara',
      stageId: 'huntRaiders',
    },
  ],
}
```

Оба effects безопасны без отдельного `startQuest`: runtime статического квеста существует с начала игры, а запись переменной и смена стадии изменяют разные его поля.

Рабочая стадия добавляет Action отчёта указанному владельцу:

```ts
huntRaiders: {
  description: 'Убить 10 рейдеров и вернуться к Маре.',

  actionIdsByTarget: {
    mara: ['mara:huntRaiders:report'],
  },
}
```

Action отчёта проверяет количество убийств после сохранённого baseline:

```ts
requirements: [{
  type: 'defeated',
  enemyTypeId: 'raider',
  baselineFromVar: {
    questId: 'huntRaidersForMara',
    key: 'defeatedAtStart',
  },
  min: 10,
}],

result: {
  effects: [{
    type: 'completeQuest',
    questId: 'huntRaidersForMara',
  }],
}
```

Если на момент принятия общий счётчик равен `37`, в `defeatedAtStart` сохраняется `37`. Action отчёта станет доступен при общем счётчике `47`.

## 8. Журнал

У квеста есть основная задача `InitialQuest.description`.

При создании runtime она добавляется первой записью:

```ts
journalEntries: [resolveText(definition.description)]
```

Каждая рабочая стадия может иметь собственное `description`. При переходе на стадию `resolveText()` применяется один раз, после чего разрешённая строка добавляется в runtime-массив квеста.

```text
Пропавший курьер

• Найти пропавшего курьера и выяснить, что произошло.
• Поговорить с Леной.
• Лена посоветовала поискать в подвале.
• В подвале обнаружены следы борьбы.
```

Записи показываются, только если квест вышел из `initialStage` и его runtime не скрыт:

```ts
const visibleInJournal =
  quest.status !== 'initial' &&
  !quest.isHidden;
```

`InitialQuest.isHidden` задаёт начальное значение runtime-поля. Если definition не указывает его, runtime получает `false`.

Журнал не:

- анализирует Actions;
- извлекает цели из `conditions`, `requirements` или `cost`;
- показывает числовые счётчики вроде `7/20` в первой версии.

Если `timeLimit.showInJournal` включён, журнал показывает соответствующий runtime-счётчик. После срабатывания таймера вместо счётчика добавляется запись «Срок истёк».

## 9. Тайм-лимиты

`timeLimit` может находиться:

- на уровне всего квеста;
- на уровне отдельной стадии.

```ts
timeLimit: {
  days: 3,
  showInJournal: true,
  onExpire: [/* effects */],
}
```

Тайм-лимит является удобным отложенным запуском effects. Он сам по себе не означает провал квеста или стадии.

Через `onExpire` можно, например:

- выполнить `failQuest`;
- перевести квест на другую стадию;
- запустить другой квест через переход его `initialStage`;
- применить другие обычные effects.

Счётчики уменьшаются при завершении дня.

### Глобальный таймер квеста

- `questDaysLeft` инициализируется при создании runtime значением `InitialQuest.timeLimit.days`;
- при `status: 'initial'` этот счётчик не уменьшается;
- при `status: 'active'` он уменьшается в конце дня;
- смена рабочей стадии сама по себе не должна начинать общий срок заново.

### Таймер стадии

- `stageDaysLeft` создаётся из `timeLimit` текущей стадии;
- таймер стадии работает и для `initialStage`;
- при переходе на другую стадию используется лимит новой стадии.

### Срабатывание таймера

Когда счётчик достигает нуля:

1. runtime-счётчик удаляется;
2. если `showInJournal: true`, в журнал добавляется запись «Срок истёк»;
3. `onExpire` добавляется в общий массив effects текущего `onDayEnd`.

Удалённый счётчик не восстанавливается из definition при следующем `onDayEnd`, поэтому `onExpire` выполняется один раз. `questDaysLeft` создаётся при создании runtime, а `stageDaysLeft` — только при входе в соответствующую стадию.

### Порядок `onDayEnd`

Обработка выполняется двумя проходами, после которых собранные effects применяются по порядку:

1. Первый проход идёт по квестам, уменьшает `stageDaysLeft` и добавляет сработавшие стадийные `onExpire` в массив effects.
2. Второй проход идёт по квестам со `status: 'active'`, уменьшает `questDaysLeft` и добавляет сработавшие квестовые `onExpire` в тот же массив.
3. После окончания обоих проходов весь массив effects выполняется в порядке добавления: сначала стадийные effects, затем квестовые.

Переход на новую стадию происходит только при последующем выполнении собранных effects. Поэтому таймер стадии, созданной во время этого `onDayEnd`, в тот же день не уменьшается.

Если оба таймера одного квеста истекли в один день, квестовые effects выполняются после стадийных и работают уже с изменениями, сделанными стадийными effects. Конфликтующие переходы или терминальные effects в этих двух наборах являются ошибкой данных квеста.

Продление, приостановка и ручной сброс таймеров в первой версии не вводятся.

## 10. Interceptors

### 10.1 Назначение

> Action — выбор игрока. Interceptor — событие, которое система запускает независимо от выбора игрока при входе в конкретный NPC/POI-контекст.

Interceptor обычно открывает Frame события. Решения игрока внутри такой сцены описываются обычными Actions Frame. Interceptor также может не иметь перехода: применить silent effects и сразу продолжить очередь.

Interceptor не смешивается с Actions в одном списке и не имеет:

- `label`;
- `requirements`;
- `cost`;
- disabled-состояния.

Контракт использует:

```ts
type InterceptorTransition = {
  type: 'frame';
  frameId: FrameId;
};

interface InterceptorResult {
  narrative?: NarrativeBlock[];
  effects?: Effect[];
  transition?: InterceptorTransition;
}

type InterceptorCheck = ActionCheckRule & {
  onSuccess: InterceptorResult;
  onFail: InterceptorResult;
};

interface InitialInterceptorBase extends BaseExecutable {
  /** Большее значение выполняется раньше. Default: 100. */
  priority?: number;
}

type InitialInterceptor = InitialInterceptorBase & (
  | { result: InterceptorResult; check?: never }
  | { check: InterceptorCheck; result?: never }
);
```

`check` Interceptor поддерживается и использует обычную форму `onSuccess`/`onFail`. Если проверка не нужна, используется `result`. Отсутствие `transition` означает продолжить очередь после применения результата; единственный переход Interceptor первой версии открывает Frame.

### 10.2 Привязка к квесту

Квестовая стадия может одновременно добавлять Action одному владельцу и Interceptor другому:

```ts
{
  actionIdsByTarget: {
    bob: ['bob:clubPass:ask'],
  },

  interceptorIdsByTarget: {
    club: ['club:clubPass:faceControl'],
  },
}
```

Slot не является `QuestTargetId`. Базовые Actions и Interceptors конкретного slot хранятся в `slot.actionIds` и `slot.interceptorIds`, а не в квестовых maps. Если slot-событие зависит от квеста, его Interceptor остаётся привязанным к slot и проверяет `questStatus` или `questVar` в собственных `conditions`.

Пример квестовой конфронтации:

```ts
maraIsAngry: {
  description: 'Мара узнала о провале поручения.',

  interceptorIdsByTarget: {
    mara: ['mara:missingCourier:confrontation'],
  },
}
```

При следующем подходе к Маре Interceptor открывает обязательный Frame. Игрок не может обойти сцену, просто не нажав кнопку в root.

### 10.3 Что считается входом

Снимок Interceptors создаётся при реальном переходе из родительского контекста в дочерний.

Каждый новый подход к slot/NPC является отдельным входом. Возврат из внутреннего Frame в root того же NPC или POI новым входом не считается.

### 10.4 Снимок и очередь

В interaction используется единая pending-очередь:

```ts
type PendingInteractionEvent =
  | { type: 'interceptor'; interceptorId: InterceptorId }
  | { type: 'forceExit' };
```

Этот раздел описывает authored items `type: 'interceptor'`. System `forceExit` не является квестовым или initial Interceptor и по общему runtime-правилу может заменить authored-остаток очереди.

Очередь:

1. Собирает Interceptors текущего контекста из всех источников: для POI — `poi.interceptorIds` и квестовую map по `poiId`; для slot/NPC — `slot.interceptorIds`, `npc.interceptorIds` occupant и квестовую map по `npcId`.
2. Проверяет `conditions`, `appearanceChance` и execution limits.
3. Сортирует их по `priority`.
4. Сохраняет ID как authored items в `pendingEvents`.
5. Извлекает следующий authored item, одновременно удаляет его из очереди и повторно проверяет актуальность definition и `conditions`.
6. Если Interceptor больше не актуален, он молча отбрасывается и берётся следующий.
7. Иначе Interceptor выполняется. Переход во Frame приостанавливает очередь; результат без перехода сразу продолжает её.

При равном `priority` допустим любой стабильный дополнительный порядок, например по ID.

Если `priority` не указан, используется `100`.

Interceptors, появившиеся после создания снимка из-за изменения state, в текущую очередь не добавляются до следующего отдельного входа или пересборки после смены time slot.

Специальный `handledInterceptorIds` не нужен: authored item удаляется из очереди до исполнения.

### 10.5 Продолжение и сброс очереди

- Возврат из Frame в root того же контекста продолжает сохранённую очередь.
- Переход в parent, другой POI, бой или завершение взаимодействия удаляет очередь.
- Переход глубже в дочерний slot или POI также удаляет очередь родителя.
- Дочерний контекст создаёт собственный снимок.
- Возвращение из дочернего контекста не восстанавливает старую очередь родителя.
- Когда очередь пуста, показывается обычный root Frame.

Пример:

```text
Вход в клуб
  → фейсконтроль
      → уйти: переход в parent, очередь удаляется
      → подкупить: возврат в root клуба, очередь продолжается
  → следующее событие из снимка
  → root клуба
```

Смена time slot удаляет старые authored items и создаёт новые для актуального состояния мира. Изменение времени считается атомарным: если одно действие пересекло несколько time slots, schedules и occupancy обновляются до конечного состояния, после чего authored-очередь пересобирается один раз. Уже запланированный system `forceExit` переживает refresh и продолжает заменять authored-очередь.

После обновления occupancy runtime сначала проверяет актуальность текущего контекста. Если NPC больше не занимает текущий slot, его interaction завершается и очередь для него не строится.

Если после действия открыт root актуального контекста, новая очередь запускается сразу. Если игрок остаётся во внутреннем Frame, очередь ждёт возврата в root. Переход в parent, другой POI, дочерний контекст, бой или завершение interaction удаляет её по обычным правилам.

Дневной результат `appearanceChance` при такой пересборке не перебрасывается. Состав очереди меняется за счёт актуальных источников, `conditions`, execution limits, schedules и occupancy.

### 10.6 Повторяемость

Один Interceptor присутствует максимум один раз в конкретной собранной очереди. После смены time slot тот же ID может снова попасть в новую очередь, если его `conditions` и execution limits всё ещё допускают выполнение. Событие, которое не должно повторяться, должно изменить содержательное состояние своих `conditions` либо использовать подходящий execution limit; отдельный список обработанных IDs не вводится.

Дополнительные лимиты:

```ts
executionLimit?: {
  perDay?: number;
  total?: number;
}
```

- `perDay` ограничивает число исполнений за календарный день;
- `total` ограничивает общее число исполнений;
- счётчик увеличивается только при фактическом запуске Interceptor; обе ветки начатого `check` считаются исполнением;
- условия стадии или мира могут сами делать Interceptor недоступным без `total`.

На первом этапе все Interceptors из снимка могут выполниться последовательно. Группы взаимоисключающих случайных событий и общий предел событий за один вход пока не вводятся.

### 10.7 Runtime-память

Конкретная структура runtime-памяти Actions и Interceptors проектируется отдельно вместе с новым interaction runtime.

Текущий `interactionSlice` можно использовать только как пример существующей реализации. Он создан для прежнего дизайна и будет почти полностью переписан; его `interactionMemoryById`, `services` и `executedTimes` не задают контракт новой системы.

Для будущего runtime зафиксированы только требования:

- вся память, относящаяся к конкретному дню, полностью очищается в конце дня, как в текущей системе;
- к дневной памяти относится дневное количество исполнений и другие значения, срок жизни которых ограничен текущим днём;
- `executionLimit.total` не является дневной памятью и не должен очищаться в конце дня;
- `pendingEvents` принадлежит текущему interaction-контексту и не является дневной или постоянной памятью. При смене time slot authored Interceptor items заменяются актуальным снимком; уже запланированный system `forceExit` сохраняется до исполнения или инвалидирования контекста;
- Actions и Interceptors используют одинаковую семантику `appearanceChance` и `executionLimit`, но хранятся и собираются как разные сущности.

Maps, массивы, размещение счётчиков и точный способ хранения результата `appearanceChance` этим документом не определяются.

### 10.8 Счётчики встреч и посещений

Первое представление NPC можно выразить Interceptor с условием по существующему счётчику встреч, а не отдельным boolean-флагом.

Счётчики обновляются при выходе из взаимодействия в не дочерний POI, но не более одного раза за календарный день:

- для NPC используется `timesMet` вместе с `lastDateMet`;
- для POI используется `visitedTimes` вместе с `lastTimeVisited`.

Отдельная дневная map для этого не нужна.

## 11. Получение доступных квестовых сущностей

На уровне initial-данных Actions и Interceptors уже сгруппированы по конкретному владельцу.

Чтобы при каждом взаимодействии не обходить все квесты, `questSlice` хранит два независимых производных индекса:

```ts
interface QuestSlice {
  questsById: Record<QuestId, QuestRuntime>;

  questActionIdsByTarget: Partial<
    Record<QuestTargetId, ActionId[]>
  >;

  questInterceptorIdsByTarget: Partial<
    Record<QuestTargetId, InterceptorId[]>
  >;
}
```

Индексы содержат только ID. Источником истины остаются definitions квестов и их runtime.

В индексах участвуют:

- при `status: 'initial'` — привязки `initialStage`;
- при `status: 'active'` — привязки текущей стадии;
- при `completed` или `failed` — ничего;
- изменение quest vars не обязано менять сам набор кандидатов: их `conditions` и `requirements` проверяются при использовании.

### Инкрементальное обновление

При смене стадии runtime уже знает предыдущий `stageId`. Этого достаточно для обновления индексов:

1. В definition предыдущей стадии берутся `actionIdsByTarget` и `interceptorIdsByTarget`.
2. Их ID удаляются из массивов соответствующих владельцев.
3. Меняются `stageId` и при необходимости `status`.
4. Привязки новой стадии добавляются в массивы новых владельцев.
5. Пустые массивы владельцев удаляются из индексов.

При `completeQuest` или `failQuest` выполняется только удаление привязок текущей стадии: новые привязки не добавляются.

Один и тот же `ActionId` или `InterceptorId` не может одновременно предоставляться несколькими источниками. Например, повторное указание `bob:askRumors` и в базовых Actions Боба, и в квестовой стадии было бы обычной ошибкой авторских данных, а не отдельной игровой ситуацией. Runtime не хранит количество источников и не выполняет дополнительную дедупликацию.

Изменение quest vars не обновляет индексы. Оно влияет только на последующую проверку `conditions` и `requirements`.

Индексы строятся целиком при создании новой игры, после чего обновляются инкрементально при изменении стадии или статуса квеста. Возможное восстановление индексов после загрузки относится к будущему persistence design и не входит в текущую миграцию.

## 12. Запуск квестов по условиям

Отдельного `startQuest` нет.

Есть три уже обсуждённых способа вывести квест из `initialStage`:

1. Обычный Action предложения выполняет `setQuestStage`.
2. Квестовый Interceptor при входе в NPC/POI непосредственно выполняет `setQuestStage` через `result` или ветку `check`, либо открывает Frame, Action которого выполняет переход.
3. Таймер `initialStage` выполняет `onExpire` с `setQuestStage`.

Interceptors остаются POI/NPC-ориентированными. События, которые должны проверяться независимо от посещения конкретного места или персонажа, относятся к отдельной глобальной системе — например, к проверке в конце дня.

Устройство глобальной системы не относится к квестовой системе. Для квеста механизм остаётся тем же независимо от источника: внешняя система выполняет обычный effect, например `setQuestStage`. Фиктивный `targetId: 'global'` не вводится.

## 13. Скрытые квесты

```ts
isHidden?: boolean;
```

Если поле не задано, квест по умолчанию не скрыт.

При создании runtime значение копируется из definition:

```ts
isHidden: definition.isHidden ?? false
```

Скрытый квест может:

- находиться на обычных стадиях;
- хранить vars;
- предоставлять Actions и Interceptors;
- реагировать на таймеры;
- не показываться в журнале.

Скрытость изменяется обычным effect:

```ts
{
  type: 'setQuestJournalVisibility',
  questId: 'undergroundObservation',
  isVisible: true,
}
```

Effect не активирует квест и не меняет его стадию. Квест со `status: 'initial'` всё равно не показывается, даже если `isVisible: true`.

`isHidden` сохраняется в `FinishedQuestRuntime`: скрытый завершённый квест не появляется в истории сам по себе, а раскрытый до завершения остаётся видимым.

## 14. Организация файлов

Связанные данные одного квеста можно держать рядом:

```ts
export const missingCourierQuest = { /* ... */ };
export const missingCourierActions = { /* ... */ };
export const missingCourierInterceptors = { /* ... */ };
export const missingCourierFrames = { /* ... */ };
```

Общие registries объединяют эти экспорты.

## 15. Сохранение и загрузка — отложено

Save/load не входит в текущую и ближайшую миграцию. Правила сверки сохранённого quest runtime с изменившимися definitions, миграция `stageId` и восстановление производных индексов будут проектироваться вместе с persistence и сейчас не ограничивают quest runtime.

## 16. Проверки целостности

Полные определения в реестрах имеют уникальные `ActionId` и `InterceptorId`. Один и тот же ID не указывается одновременно несколькими источниками.

Обычный Action исполняется из уже актуализированного набора UI-вариантов. При нажатии не выполняется повторный полный resolver его присутствия, `conditions` или `requirements`; динамическая стоимость разрешается один раз для начатой попытки. После завершения любого Action все варианты фактически показываемого экрана собираются заново.

Перед исполнением ожидающего Interceptor повторно проверяются его актуальность и `conditions`, как описано в модели очереди Interceptors.

В development initial-данные проверяются как минимум на:

- уникальность Quest IDs;
- существование всех указанных Action, Interceptor, Frame, Quest и Stage IDs;
- отсутствие одного и того же Action/Interceptor одновременно в нескольких root-источниках одного контекста; повторное использование Action во внутренних Frames само по себе не запрещается;
- существование Quest IDs, указанных в quest effects и квестовых conditions;
- наличие ровно одного оператора `equals` или `notEquals` в каждом `QuestVarCondition`;
- корректность target IDs;
- положительное целое значение `timeLimit.days`;
- положительные целые значения указанных `executionLimit.perDay` и `executionLimit.total`;
- отсутствие нескольких lifecycle-effects одного квеста в одном блоке `ActionResult.effects`, `InterceptorResult.effects` или `QuestTimeLimit.onExpire`.

## 17. Вынесено за рамки первой версии

Ниже сохранены темы для отдельного будущего проектирования. Они не являются частью утверждённого контракта статических квестов.

### 17.1 Динамические квесты

Динамические квесты не входят в утверждённую первую версию системы. Ни одна структура ниже пока не является частью `QuestSlice`, формата сохранения или публичного контракта фабрик. Этот материал сохранён, чтобы продолжить обсуждение, а не начинать его заново.

Конкретный рассматриваемый сценарий: фабрика создаёт поручение «убить N врагов и отчитаться конкретному NPC».

Обсуждаемый вход фабрики:

```ts
interface HuntEnemiesQuestParams {
  enemyTypeId: EnemyTypeId;
  count: number;
  reportTargetId: QuestTargetId;
}

createHuntEnemiesQuest('huntRaiders:42', {
  enemyTypeId: 'raider',
  count: 10,
  reportTargetId: 'mara',
});
```

Фабрика потенциально должна вернуть связанный комплект Quest definition, Actions, Frames и при необходимости Interceptors. `enemyTypeId`, `count` и `reportTargetId` являются неизменяемыми параметрами созданного экземпляра; дублировать их в quest vars без runtime-причины не нужно.

Подтверждённая форма requirement внутри такого фабричного квеста:

```ts
{
  type: 'defeated',
  enemyTypeId: params.enemyTypeId,
  baselineFromVar: {
    questId: 'huntRaiders:42',
    key: 'defeatedAtStart',
  },
  min: params.count,
}
```

Baseline по-прежнему создаётся обсуждённым effect:

```ts
{
  type: 'snapshotDefeatedCount',
  questId: 'huntRaiders:42',
  key: 'defeatedAtStart',
  enemyTypeId: params.enemyTypeId,
}
```

Один из обсуждавшихся вариантов сохранения происхождения динамического квеста:

```ts
interface DynamicQuestSource<TParams = unknown> {
  factoryId: DynamicQuestFactoryId;
  params: TParams;
}

interface SavedDynamicQuestInstance<TParams = unknown>
  extends DynamicQuestSource<TParams> {
  questId: QuestId;
  runtime: QuestRuntime;
}
```

Альтернативно источники могли бы храниться отдельно:

```ts
dynamicQuestSourcesById: Record<
  QuestId,
  DynamicQuestSource
>;
```

Тогда при загрузке фабрика по `factoryId` повторно строит неизменяемые definitions из сохранённых `params`, после чего применяется сохранённый runtime и перестраиваются производные индексы.

Предварительный жизненный цикл, который обсуждался, но не утверждён:

1. Внешняя система вызывает зарегистрированную фабрику с параметрами.
2. Фабрика генерирует уникальные Quest/Action/Frame/Interceptor IDs и definitions.
3. Definitions регистрируются, для квеста создаётся runtime.
4. Runtime может начинаться либо в `initialStage`, либо сразу на рабочей стадии — это ещё не выбрано.
5. После завершения динамический квест можно удалить из state и журнала, в отличие от статического.
6. При удалении сначала убираются его привязки из производных индексов, затем runtime/source и сгенерированные definitions.

Остаются спорными:

- кто создаёт уникальный `questId` и IDs зависимых сущностей;
- возвращает ли фабрика новый квест в `initialStage` или уже активным;
- где живут сгенерированные definitions;
- сохраняется один объект `SavedDynamicQuestInstance` или раздельные runtime и `dynamicQuestSourcesById`;
- когда именно удалять завершённый динамический квест и его журнал;
- что делать при загрузке, если фабрика с сохранённым `factoryId` больше не существует.

### 17.2 Runtime Actions и Interceptors

Точное устройство runtime-памяти, дневных и общих execution-счётчиков, а также хранение результата `appearanceChance` будет определено при переписывании interaction runtime.

Текущий `interactionSlice` используется только как пример существующей реализации, а не как обязательная основа нового дизайна. Требования, уже зафиксированные для будущего runtime, перечислены в разделе 10.7.

## 18. Что сознательно не вводится сейчас

- универсальные `tasks`/`objectives`;
- извлечение целей журнала из Actions;
- числовые счётчики журнала;
- отдельный `startQuest`;
- универсальное чтение произвольных значений state в quest vars;
- динамические квесты в утверждённой первой версии;
- `questStage` condition без конкретной межквестовой зависимости;
- общий condition времени без конкретного сценария;
- смешивание Actions и Interceptors в одном списке;
- квестовый event bus;
- фиктивный глобальный target для Interceptors.
