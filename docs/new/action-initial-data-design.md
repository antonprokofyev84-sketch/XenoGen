# Initial Action Data Design

## Статус и границы

Документ собирает решения по базе Actions. Это описание авторского контента, из которого движок получает правила действий. Счётчики, сохранённые броски, текущий interaction, применение effects и работа Zustand описаны отдельно в `interaction-runtime-engine-questions.md`.

Используется согласованная модель Frames: Frame описывает ситуацию и содержит ссылки на Actions; Action описывает выбор игрока и его результат. Простое действие может не менять Frame.

Приведённые TypeScript-формы — целевой контракт для дальнейшей реализации. Это не утверждение, что такие типы и обработчики уже есть в проекте. Каталог effects текущей миграции закрыт в `migration-decisions.md`; расширение требует отдельного утверждённого сценария.

## 1. Registry и организация файлов

```ts
export const INITIAL_ACTIONS: Record<ActionId, InitialAction>;
```

`ActionId` — ключ registry. Поле `id` внутри Action пока не нужно.

Definitions можно хранить в отдельных файлах по POI, NPC, квесту или группе общих действий, затем объединять в `INITIAL_ACTIONS`. Единого физического файла не требуется. Связанные Actions удобно держать рядом; фабрики допустимы как способ создавать обычные definitions без копирования.

Ссылки на Actions находятся в `actionIds` у POI, slots, NPC и Frames. Квестовые Actions подключаются через quest action map. Один Action может использоваться в нескольких Frames.

Initial Action не содержит количество выполнений, результат броска видимости, текущий Frame, текущего NPC или изменяемый внутренний state. Его функции не мутируют store.

При желании initial-файл может содержать краткий комментарий с наиболее важными defaults, но это не является обязательной частью контракта: нормативные defaults задаются типами, нормализатором и этим документом.

## 2. Базовая структура

```ts
export type ActionNumber = number | ((context: ActionContext) => number);

export interface ExecutionLimit {
  perDay?: number;
  total?: number;
}

export interface InitialActionBase {
  label: LocalizedText;

  // Все условия должны выполняться; иначе Action скрыт.
  conditions?: ActionCondition[];

  // Все требования должны выполняться; иначе Action disabled.
  requirements?: ActionCondition[];

  appearanceChance?: ActionNumber;
  cost?: ActionCost;
  executionLimit?: ExecutionLimit;
}

export type InitialAction = InitialActionBase &
  (
    | {
        result: ActionOutcome;
        check?: never;
      }
    | {
        check: ActionCheck;
        result?: never;
      }
  );

export interface ActionResult {
  narrative?: NarrativeBlock[];
  effects?: Effect[];
  transition?: ActionTransition;
}

export interface WeightedActionResult {
  weight: ActionNumber;
  result: ActionResult;
}

export type ActionOutcome = ActionResult | WeightedActionResult[];
```

У Action есть либо обычный `result`, либо `check` с ветками. Одновременно оба поля не используются. Отдельный `type: 'direct' | 'checked'` не требуется.

`ActionResult` содержит только narrative, effects и необязательный transition. Background и `npcDisplay` принадлежат Frame; ActionResult не переопределяет их.

## 3. Defaults

| Отсутствующее поле                    | Значение по смыслу                           |
| ------------------------------------- | -------------------------------------------- |
| `conditions`                          | Нет условий скрытия                          |
| `requirements`                        | Нет дополнительных требований доступности    |
| `appearanceChance`                    | `1`: случайного ограничения видимости нет    |
| `cost` или отдельная его составляющая | Нет соответствующей стоимости                |
| `executionLimit.perDay`               | Нет дневного лимита выполнений               |
| `executionLimit.total`                | Нет общего лимита выполнений                 |
| `narrative`                           | Не добавлять художественный текст результата |
| `effects`                             | Нет эффектов результата                      |
| `transition`                          | Остаться в текущем Frame                     |

`label` обязателен. Для Action обязательно задаётся один из вариантов `result` / `check`. Внутри `check` обе ветки обязательны; пустую по смыслу ветку можно явно записать как `{}`.

Для вариантов случайного результата `weight` задаётся явно. Пустой массив результатов не имеет смысла. Пустые optional-массивы в авторских данных писать не нужно.

## 4. Conditions, requirements и стоимость

Для `conditions` и `requirements` используется один тип `ActionCondition`. Различается реакция на невыполнение:

| Механизм           | Что описывает                                        | Если проверка не пройдена                     |
| ------------------ | ---------------------------------------------------- | --------------------------------------------- |
| `conditions`       | Стоит ли вообще показывать Action                    | Скрыть                                        |
| `requirements`     | Можно ли сейчас выполнить видимый Action             | Disabled                                      |
| `cost`             | Что будет потрачено при попытке                      | Disabled, если ресурсов недостаточно          |
| `executionLimit`   | Сколько попыток разрешено за день и/или за всё время | Disabled, если соответствующий лимит исчерпан |
| `appearanceChance` | Случайное появление на этот день                     | Скрыть при неудачном броске                   |

Массивы условий работают как **AND**. Группы OR/NOT на этом этапе не вводятся.

Например, зависимость начала квеста от отношений с барменом задаётся через `conditions`: игроку не нужно видеть двадцать недоступных квестовых предложений. Уже известную цель «убить 10 рейдеров» можно проверять через `requirements`, оставляя кнопку сдачи видимой до выполнения цели.

Десять морковок, которые нужно отдать, — `cost.items`. Если морковки нужны только как условие и не расходуются, это `requirements` либо `conditions`, в зависимости от желаемой видимости.

### Поддерживаемые условия

За основу берутся уже существующие в проекте условия:

- характеристика персонажа — `stat`;
- навык — `skill`;
- количество предметов — `item`;
- число побеждённых врагов определённого типа — `defeated`;
- affection текущего либо явно указанного NPC — `affection`;
- репутация фракции текущего субъекта либо явно указанной фракции — `reputation`;
- число состоявшихся встреч с конкретным NPC — `timesMet`;
- итоговый уровень регионального параметра текущего POI — `regionLevel`.

К существующим условиям в первой версии добавляются проверки квестовой переменной и статуса квеста:

```ts
type QuestVarCondition =
  | {
      type: 'questVar';
      questId: QuestId;
      key: string;
      equals: QuestVarValue;
      notEquals?: never;
    }
  | {
      type: 'questVar';
      questId: QuestId;
      key: string;
      notEquals: QuestVarValue;
      equals?: never;
    };

interface QuestStatusCondition {
  type: 'questStatus';
  questId: QuestId;
  status: 'initial' | 'active' | 'completed' | 'failed';
}

interface RegionLevelCondition {
  type: 'regionLevel';
  param: RegionParameterKey;
  min?: number;
  max?: number;
  exact?: number;
}

interface TimesMetCondition {
  type: 'timesMet';
  npcId: NpcId;
  min?: number;
  max?: number;
  exact?: number;
}
```

Отсутствующая quest var сравнивается как обычный `undefined`: она не преобразуется в `false`. `questStage` и общее условие времени в первую версию не входят; их можно добавить позднее по конкретному сценарию.

`min`, `max` и `exact` остаются в числовых типах. Границы включительные; `exact` означает равенство. Quest vars сравниваются через взаимоисключающие `equals` или `notEquals`, а статус квеста — с одним точным значением.

Примеры формы условий:

```ts
conditions: [
  { type: 'affection', npcId: 'bob', min: 10 },
],

requirements: [
  { type: 'defeated', enemyTypeId: 'raider', min: 10 },
],
```

Для `affection` и `reputation` явный ID optional. Если он отсутствует, condition адресует текущий interaction subject:

```text
affection без npcId   → текущий NPC slot/NPC-контекста
reputation без factionId → фракция текущего NPC, затем фракция текущего POI
```

Явный `npcId` или `factionId` переопределяет default. Если текущий субъект невозможно разрешить, это authoring error валидатора, а не обычный результат `false`. Остальные conditions (`stat`, `skill`, `item`, `defeated`, `questVar`, `questStatus`, `regionLevel`) не получают неявную текущую цель. `regionLevel` читает итоговый уровень текущего POI через canonical `resolvePoiRegionLevels`.

Стадию собственного квеста не нужно дублировать в каждом Action: производный квестовый индекс подключает Action только на текущей стадии.

Для условия «победить N врагов после принятия квеста» `defeated` может явно использовать сохранённое начальное значение:

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

Без `baselineFromVar` проверяется общий накопительный счётчик. С ним проверяется разница между текущим счётчиком и числом в указанной quest var. Создание baseline описано в квестовом документе специализированным effect `snapshotDefeatedCount`.

Погодные условия и дополнительные проверки POI без конкретной потребности не добавляются.

## 5. Числа и чистые функции

Числовое значение Action, зависящее от игры, можно задавать функцией. В v1 это относится к шансам, сложности, весам результатов и составляющим стоимости. Числовые аргументы утверждённых effects пока статичны; конкретный effect можно расширить до функции позднее вместе со сценарием, которому это действительно нужно.

```ts
export interface ActionContext {
  readonly poiId: PoiId;
  readonly slotId?: SlotId;
  readonly npcId?: NpcId;
  readonly frameId: FrameId;

  /** Curated values; content does not read Zustand slices directly. */
  readonly regionLevels: Readonly<RegionLevels>;
  readonly currentNpcAffection?: number;
  readonly effectiveRelation?: number;
  readonly tension?: number;

  readonly getQuestVar: (questId: QuestId, key: string) => QuestVarValue | undefined;
}
```

Это минимальное направление курируемого read-only facade. `slotId` и `npcId` присутствуют вместе. Точная финальная форма может быть уточнена при реализации, но content-функции не получают сырой `StoreState` и не читают произвольные slices. Частые проверки регионального уровня описываются декларативным `regionLevel`, а не функцией.

Функция:

- читает переданный context;
- возвращает число;
- не мутирует store и не вызывает world/interaction actions;
- не бросает случайность самостоятельно.

Бросок выполняет движок. Чистая функция только определяет его шанс или вес.

Поля `executionLimit.perDay` и `executionLimit.total` пока остаются обычными числами. Переход к функциям для таких полей можно добавить при появлении реального использования; отдельный механизм для каждого числового поля не нужен.

Региональные величины сохраняют согласованные единицы: raw-параметры клетки — числа `0..999`, включая дробные значения; конечные уровни POI — целые `0..9`. Функция выбирает нужную величину для конкретного правила. `delta` регионального эффекта не становится уровнем только потому, что его вычисляет функция.

## 6. Случайная видимость

```ts
appearanceChance: 0.3,
```

`appearanceChance` вынесен из `conditions`, потому что у них разный срок действия:

- обычные conditions проверяются при актуализации доступности;
- результат случайной видимости сохраняется на весь день.

Шанс задаётся числом `0..1` либо чистой функцией, возвращающей число в этом диапазоне. `0` — не появится, `1` — появится при выполнении остальных условий.

Повторный вход или переход между Frames не даёт новый бросок для того же Action и субъекта в тот же день. Как хранится результат и когда выполняется первый бросок, зафиксировано в runtime-документе.

## 7. Checks и гарантированный успех

```ts
type ActionCheckRule =
  | {
      type: 'stat';
      statId: MainStatKey;
      difficulty: ActionNumber;
    }
  | {
      type: 'skill';
      skillId: SkillKey;
      difficulty: ActionNumber;
    }
  | {
      type: 'chance';
      chance: ActionNumber;
    };

export type ActionCheck = ActionCheckRule & {
  onSuccess: ActionOutcome;
  onFail: ActionOutcome;
};
```

`stat` и `skill` используют механику проверки характеристики/навыка. `chance` задаёт непосредственно вероятность успеха `0..1`. Difficulty не обязана иметь те же единицы, что chance.

**Отдельные `autoSuccess` и `autoSuccessRelation` не вводятся.** Если вероятность должна стать гарантированной при определённом состоянии, чистая функция возвращает `1`.

Например, с использованием поля старого interaction slice:

```ts
const resolvePersuasionChance = ({ effectiveRelation = 0 }: ActionContext): number => {
  return effectiveRelation >= 20 ? 1 : 0.4;
};
```

Порог `20` и шанс `0.4` здесь только пример баланса.

```ts
check: {
  type: 'chance',
  chance: resolvePersuasionChance,
  onSuccess: {
    narrative: [{ speakerId: '$npc', text: 'Хорошо, я помогу.' }],
  },
  onFail: {
    narrative: [{ speakerId: '$npc', text: 'Нет.' }],
  },
},
```

Обычному действию, которое вообще не требует проверки, достаточно `result`.

Возможность уйти из encounter в зависимости от threat задаётся Action: через `appearanceChance`, если должна случайно появляться кнопка, либо через `check.chance`, если случайным должен быть исход попытки. Frame только ссылается на Action. Конкретная формула относится к балансу.

## 8. Случайный выбор одного результата

Вместо одного `ActionResult` можно передать массив взвешенных вариантов:

```ts
result: [
  {
    weight: 3,
    result: {
      narrative: ['Ничего интересного.'],
    },
  },
  {
    weight: 1,
    result: {
      narrative: ['В щели между досками лежит монета.'],
      effects: [{ type: 'addMoney', amount: 1 }],
    },
  },
],
```

Названия конкретных effects в примерах задают их назначение; общий `Effect` будет собираться из нужных проекту обработчиков и использоваться Actions, Interceptors и квестовыми таймерами.

Правила:

1. Выбирается ровно один результат.
2. `weight` — относительный вес, а не независимый chance.
3. Сумма весов не обязана быть `1`.
4. Вероятность варианта равна его весу, делённому на сумму разрешённых весов.
5. Вес может быть чистой функцией от контекста, включая региональные параметры.
6. Вес `0` исключает вариант; веса неотрицательны, их общая сумма должна быть положительной.

В примере вероятности равны `3/4` и `1/4`. Массив взвешенных результатов допустим также внутри `check.onSuccess` и `check.onFail`.

Это не меняет смысл других вероятностей. `appearanceChance` и `check.chance` остаются `0..1`. Независимые chance rolls отдельных дневных effects POI также остаются независимыми; это другой механизм.

## 9. Стоимость попытки

```ts
export interface ActionCost {
  money?: ActionNumber;
  stamina?: ActionNumber;
  time?: ActionNumber; // минуты игрового времени
  items?: {
    itemId: ItemId;
    count: ActionNumber;
  }[];
}
```

`cost` — единственный источник обязательных затрат. Не нужно одновременно описывать одну плату как условие наличия денег и как effect их списания.

`cost.stamina` всегда относится к личной stamina протагониста, который по умолчанию выполняет Action.

Если ресурсов недостаточно, действие disabled и попытка не начинается. Если попытка началась, стоимость списывается и при успехе, и при провале `check`.

Награды и дополнительные последствия выбранной ветки остаются effects. Например, плата за попытку переговоров относится к `cost`, а штраф за угрозу — к `onFail.effects`.

Стоимость может быть динамической. Проверка наличия ресурсов и фактическое списание должны использовать одну разрешённую стоимость конкретной попытки; порядок обеспечивает executor.

## 10. Effects и их цели

Effects описывают изменения игры. Каталог текущей миграции ограничен утверждёнными quest effects, structural effects, `modifyTension` и rewards инвентаря протагониста `addMoney`, `addItem`, `removeItem`; остальные социальные, stat/skill, arbitrary-target inventory effects добавляются только под конкретный принятый сценарий.

```ts
interface MarkCurrentPoiForRemovalEffect {
  type: 'markCurrentPoiForRemoval';
}

interface ModifyTensionEffect {
  type: 'modifyTension';
  delta: number;
}

type Effect =
  | QuestEffect
  | ChangeRegionParameterEffect
  | DisablePoiEntryForDaysEffect
  | SetPoiEntryDisabledEffect
  | MarkCurrentPoiForRemovalEffect
  | ModifyTensionEffect
  | { type: 'addMoney'; amount: number }
  | { type: 'addItem'; itemId: ItemId; count: number }
  | { type: 'removeItem'; itemId: ItemId; count: number };
```

`QuestEffect`, `ChangeRegionParameterEffect` и оба effect доступа определены в профильных документах. Все варианты используют общий discriminator `type`. В первой версии `changeRegionParameter.delta` и `modifyTension.delta` — статические конечные числа; динамический effect argument добавляется только вместе с реальным сценарием.

Цель каждого утверждённого effect задаётся однозначно:

- quest effects несут явный `questId`;
- `disablePoiEntryForDays` и `setPoiEntryDisabled` используют явный `poiId` либо `'$currentPoi'`;
- `markCurrentPoiForRemoval` всегда относится к текущему POI;
- `changeRegionParameter` относится к root cell текущего POI-контекста; для `onDayPass` это POI-владелец эффекта;
- `modifyTension` относится к текущему NPC subject и поэтому требует NPC-контекст;
- `addMoney`, `addItem` и `removeItem` относятся к инвентарю протагониста; произвольный target инвентаря в v1 не вводится.

Effects изменения affection или faction reputation в v1 union не входят. Их текущая/явная цель будет спроектирована только вместе с конкретным утверждённым сценарием.

Action в глобальном registry не должен терять цель квестового эффекта. В примерах она указана явно:

```ts
{
  type: 'setQuestStage',
  questId: 'missingCourier',
  stageId: 'searchCellar',
}
```

Если при проектировании базы quests будет выбран другой однозначный способ передавать quest context, его нужно будет согласовать с effects. Выводить цель из строки Action ID не требуется.

### Пометка POI на удаление

Action может пометить текущий POI на удаление и обычным transition вывести партию в родителя:

```ts
result: {
  effects: [
    { type: 'markCurrentPoiForRemoval' },
  ],
  transition: { type: 'parentPoi' },
},
```

Effect рекурсивно ставит runtime-пометку текущему POI и всем его потомкам. Это важно не только для будущего удаления: каждый помеченный узел сразу перестаёт участвовать в новых взаимодействиях и не выполняет `onDayPass`.

Физическое удаление выполняется один раз общим проходом в конце дня после остальных дневных систем. `pendingRemoval` не является полем initial Action или initial POI.

Пометка зависит от смысла действия: завершили encounter, забрали тайник и т. п. Опустевший торговый инвентарь сам по себе не означает, что POI нужно удалить.

## 11. Transitions

```ts
export type ActionTransition =
  | { type: 'frame'; frameId: FrameId }
  | { type: 'root' }
  | { type: 'currentPoi' }
  | { type: 'parentPoi' }
  | { type: 'poi'; poiId: PoiId }
  | { type: 'trade' }
  | { type: 'combat' };
```

| Transition   | Значение                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| Не указан    | Остаться в текущем Frame                                                      |
| `frame`      | Открыть указанный Frame в текущем interaction-контексте                       |
| `root`       | Вернуться в root текущего контекста: POI либо slot/NPC                        |
| `currentPoi` | Перейти в root текущего POI, закончив slot/NPC-контекст; партию не перемещать |
| `parentPoi`  | Переместить партию в родительский POI/клетку                                  |
| `poi`        | Переместить партию в указанный POI                                            |
| `trade`      | Открыть торговлю; текущий Frame сохраняется                                   |
| `combat`     | Запустить бой                                                                 |

Если текущий контекст уже POI, `currentPoi` означает возврат к его root. Это не повторный travel и не новое посещение.

Frame ID указывает на definition. Он не меняет автоматически текущего NPC, POI или цель effects: например, переход на `bob:missingCourier:question` сам по себе не устанавливает `npcId: 'bob'`.

Отдельный `{ type: 'stay' }` не нужен. Навигация находится в `ActionResult.transition`; effects содержат изменения состояния, необходимые действию.

Бой Action только запускает. После победы игрок попадает в послебоевой Frame с добычей и отдельным Action ухода. Как бой выбирает этот Frame и передаёт результат, относится к runtime/боевой системе.

Создаваемые по slots и дочерним POI элементы интерфейса обсуждаются отдельно: их не требуется заранее перечислять как статические definitions в `INITIAL_ACTIONS`.

## 12. Narrative результата

Используется тот же формат, что и у Frame:

```ts
export interface DialogueLine {
  speakerId: CharacterId | '$npc';
  text: LocalizedText;
}

export interface ThoughtLine {
  thought: LocalizedText;
}

export type LocalizedText = string;
export type NarrativeBlock = LocalizedText | DialogueLine | ThoughtLine;
```

```ts
narrative: [
  '{$npc} отставляет кружку.',
  { speakerId: '$npc', text: 'Что ты хочешь узнать?' },
  { thought: 'Кажется, он что-то скрывает.' },
],
```

`$npc` — NPC текущего slot-контекста. `{$npc}` подставляет имя знакомого NPC либо название роли незнакомого. Подстановка выполняется один раз при создании log event; в log сохраняются конкретные значения.

При создании log event `resolveText()` и `{$npc}` применяются один раз. Log хранит только разрешённые narrative blocks. Background, visual variant, overlay layout, role и display name исходного Frame отдельно не снимкуются.

Обычному выходу из POI не требуется специальный narrative.

## 13. Ограничения исполнения

```ts
executionLimit: {
  perDay: 1,
  total: 3,
},
```

`perDay` ограничивает число начатых попыток за игровой день, включая провал проверки. Выход и повторный вход не сбрасывают лимит; дневной счётчик очищается в конце дня.

`total` ограничивает общее число начатых попыток и не очищается в конце дня. Поля независимы и могут использоваться по отдельности или вместе.

Ключ ограничения: **subject + actionId**. Subject — конкретный NPC в slot-контексте либо конкретный экземпляр POI в POI-контексте. `frameId` в ключ не входит.

Следствия для контента:

- два encounter с одним template имеют независимые счётчики;
- одно персональное действие у разных NPC имеет независимые счётчики;
- один Action в разных Frames одного subject использует общий счётчик;
- два разных сундука у одного subject требуют разных Action IDs, если попытки должны учитываться независимо.

Общие definitions и фабрики позволяют переиспользовать логику, сохранив разные IDs действий.

Если одноразовость уже естественно выражается состоянием квеста, предмета или существованием POI, `total` указывать необязательно.

## 14. Пример согласованного набора Actions

```ts
// Defaults:
// conditions/requirements отсутствуют — соответствующих ограничений нет.
// appearanceChance отсутствует — 1.
// cost отсутствует — нет затрат.
// executionLimit отсутствует — нет дневного и общего лимита.
// narrative/effects отсутствуют — ничего не добавляют.
// transition отсутствует — текущий Frame сохраняется.

export const RED_BOAR_ACTIONS = {
  'redBoar:buyDrink': {
    label: 'Купить выпивку',
    cost: { money: 5, time: 15 },
    result: {
      narrative: ['Выпивка обжигает горло.'],
    },
  },

  'bartender:askRumors': {
    label: 'Спросить о слухах',
    executionLimit: { perDay: 1 },
    result: {
      narrative: [{ speakerId: '$npc', text: 'У восточных руин снова видели чужаков.' }],
    },
  },

  'bob:missingCourier:question': {
    label: 'Спросить о пропавшем курьере',
    result: {
      transition: {
        type: 'frame',
        frameId: 'bob:missingCourier:question',
      },
    },
  },

  'bob:missingCourier:persuade': {
    label: 'Убедить помочь',
    executionLimit: { perDay: 1 },
    check: {
      type: 'chance',
      chance: resolvePersuasionChance,
      onSuccess: {
        narrative: [{ speakerId: 'bob', text: 'Он спустился в подвал. Начни оттуда.' }],
        effects: [
          {
            type: 'setQuestStage',
            questId: 'missingCourier',
            stageId: 'searchCellar',
          },
        ],
        transition: { type: 'root' },
      },
      onFail: {
        narrative: [{ speakerId: 'bob', text: 'Я не хочу в это ввязываться.' }],
      },
    },
  },

  'bob:missingCourier:changeSubject': {
    label: 'Сменить тему',
    result: { transition: { type: 'root' } },
  },

  'redBoar:trade': {
    label: 'Торговать',
    result: { transition: { type: 'trade' } },
  },

  'redBoar:leave': {
    label: 'Уйти',
    result: { transition: { type: 'parentPoi' } },
  },
} satisfies Record<ActionId, InitialAction>;
```

Квестовый Action `question` подключается quest action map к Бобу. Его переход открывает внутренний Frame; текст вопроса и ссылки на `persuade` / `changeSubject` находятся в этом Frame. Условия собственной стадии здесь повторно не записаны.

При провале `persuade` Frame сохраняется. Исчерпанная попытка не мешает выбрать другой Action — например, сменить тему.

## 15. Что оставлено на дальнейшую работу

Это не список причин откладывать initial-базу. Остались конкретные точки интеграции:

1. Добавлять новые варианты `ActionCondition` только под конкретные игровые сценарии; в первой версии из квестовых условий зафиксированы `questVar` и `questStatus`.
2. Расширять общий `Effect` по реальным механикам; не пытаться сейчас перечислить все возможные effects.
3. При работе с quests окончательно согласовать передачу quest context в глобальные Actions и эффекты; в примерах используется явный `questId`.
4. При проектировании runtime определить окончательный `ActionContext`, selectors, тип исполнителя проверки и единый resolver чисел.

Место обработки transitions, дневная память, appearance rolls и принятый порядок исполнения описаны в `interaction-runtime-state-design.md` и `interaction-runtime-engine-questions.md`. `performAction` доверяет актуализированным UI-вариантам: повторного полного resolver/recheck при нажатии нет. Отдельное поле автоуспеха не требуется.
