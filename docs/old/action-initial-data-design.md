# Initial Action Data Design

## Статус и границы

Документ собирает решения по базе Actions. Это описание авторского контента, из которого движок получает правила действий. Счётчики, сохранённые броски, текущий interaction, применение effects и работа Zustand описаны отдельно в `interaction-runtime-engine-questions.md`.

Используется согласованная модель Frames: Frame описывает ситуацию и содержит ссылки на Actions; Action описывает выбор игрока и его результат. Простое действие может не менять Frame.

Приведённые TypeScript-формы — целевой контракт для дальнейшей реализации. Это не утверждение, что такие типы и обработчики уже есть в проекте. Полный каталог effects расширяется по мере разработки.

## 1. Registry и организация файлов

```ts
export const INITIAL_ACTIONS: Record<ActionId, InitialAction>;
```

`ActionId` — ключ registry. Поле `id` внутри Action пока не нужно.

Definitions можно хранить в отдельных файлах по POI, NPC, квесту или группе общих действий, затем объединять в `INITIAL_ACTIONS`. Единого физического файла не требуется. Связанные Actions удобно держать рядом; фабрики допустимы как способ создавать обычные definitions без копирования.

Ссылки на Actions находятся в `actionIds` у POI, slots, NPC и Frames. Квестовые Actions подключаются через quest action map. Один Action может использоваться в нескольких Frames.

Initial Action не содержит количество выполнений, результат броска видимости, текущий Frame, текущего NPC или изменяемый внутренний state. Его функции не мутируют store.

**В начале каждого initial-файла обязательно перечисляются defaults optional-полей в комментарии.** При изменении полей комментарий обновляется вместе с типом.

## 2. Базовая структура

```ts
export type ActionNumber =
  | number
  | ((context: ActionContext) => number);

export interface InitialActionBase {
  label: string;

  // Все условия должны выполняться; иначе Action скрыт.
  conditions?: ActionCondition[];

  // Все требования должны выполняться; иначе Action disabled.
  requirements?: ActionCondition[];

  appearanceChance?: ActionNumber;
  cost?: ActionCost;
  maxExecutions?: number;
}

export type InitialAction = InitialActionBase & (
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
  effects?: ActionEffect[];
  transition?: ActionTransition;
}

export interface WeightedActionResult {
  weight: ActionNumber;
  result: ActionResult;
}

export type ActionOutcome =
  | ActionResult
  | WeightedActionResult[];
```

У Action есть либо обычный `result`, либо `check` с ветками. Одновременно оба поля не используются. Отдельный `type: 'direct' | 'checked'` не требуется.

`ActionResult` содержит только narrative, effects и необязательный transition. Background и `npcDisplay` принадлежат Frame; ActionResult не переопределяет их.

## 3. Defaults

| Отсутствующее поле | Значение по смыслу |
|---|---|
| `conditions` | Нет условий скрытия |
| `requirements` | Нет дополнительных требований доступности |
| `appearanceChance` | `1`: случайного ограничения видимости нет |
| `cost` или отдельная его составляющая | Нет соответствующей стоимости |
| `maxExecutions` | Нет дневного лимита выполнений |
| `narrative` | Не добавлять художественный текст результата |
| `effects` | Нет эффектов результата |
| `transition` | Остаться в текущем Frame |

`label` обязателен. Для Action обязательно задаётся один из вариантов `result` / `check`. Внутри `check` обе ветки обязательны; пустую по смыслу ветку можно явно записать как `{}`.

Для вариантов случайного результата `weight` задаётся явно. Пустой массив результатов не имеет смысла. Пустые optional-массивы в авторских данных писать не нужно.

## 4. Conditions, requirements и стоимость

Для `conditions` и `requirements` используется один тип `ActionCondition`. Различается реакция на невыполнение:

| Механизм | Что описывает | Если проверка не пройдена |
|---|---|---|
| `conditions` | Стоит ли вообще показывать Action | Скрыть |
| `requirements` | Можно ли сейчас выполнить видимый Action | Disabled |
| `cost` | Что будет потрачено при попытке | Disabled, если ресурсов недостаточно |
| `maxExecutions` | Сколько попыток разрешено за день | Disabled, если лимит исчерпан |
| `appearanceChance` | Случайное появление на этот день | Скрыть при неудачном броске |

Массивы условий работают как **AND**. Группы OR/NOT на этом этапе не вводятся.

Например, зависимость начала квеста от отношений с барменом задаётся через `conditions`: игроку не нужно видеть двадцать недоступных квестовых предложений. Уже известную цель «убить 10 рейдеров» можно проверять через `requirements`, оставляя кнопку сдачи видимой до выполнения цели.

Десять морковок, которые нужно отдать, — `cost.items`. Если морковки нужны только как условие и не расходуются, это `requirements` либо `conditions`, в зависимости от желаемой видимости.

### Поддерживаемые условия

За основу берутся уже существующие в проекте условия:

- характеристика персонажа — `stat`;
- навык — `skill`;
- количество предметов — `item`;
- число побеждённых врагов определённого типа — `defeated`;
- affection конкретного NPC — `affection`;
- репутация конкретной фракции — `reputation`.

Также нужны условия времени суток и проверки состояния другого квеста: стадия либо quest flag/variable. Проверка стадии полезна, например, когда побочный квест зависит от основного.

`min`, `max` и `exact` остаются в типах. Для числовых проверок границы включительные; `exact` означает равенство. Стадия квеста или значение флага сравниваются по соответствующему типу значения.

Примеры формы условий:

```ts
conditions: [
  { type: 'affection', npcId: 'bob', min: 10 },
],

requirements: [
  { type: 'defeated', enemyTypeId: 'raider', min: 10 },
],
```

NPC, фракция и квест в условиях указываются конкретными IDs. `$current` для conditions сейчас не вводится. Это не отменяет `$npc` в narrative.

Стадию собственного квеста не нужно дублировать в каждом Action, если quest action map уже подключает его только на нужной стадии. Полную форму новых условий времени и квестов стоит согласовать с их типами при реализации общего `ActionCondition`.

Погодные условия и дополнительные проверки POI без конкретной потребности не добавляются.

## 5. Числа и чистые функции

Числовое значение, зависящее от игры, можно задавать функцией. Это относится к шансам, сложности, весам результатов, составляющим стоимости и числовым аргументам effects там, где они нужны.

```ts
export interface ActionContext {
  readonly state: Readonly<StoreState>;
  readonly poiId: PoiId;
  readonly slotId?: SlotId;
  readonly npcId?: NpcId;
  readonly frameId: FrameId;
}
```

Это минимальное направление контракта: доступ к актуальному состоянию и идентификаторам контекста. `slotId` и `npcId` присутствуют вместе. `state`, включая вложенные данные, доступен функции только для чтения; поверхностный `Readonly` сам по себе не обеспечивает это для всех вложенных объектов.

Заранее собирать большой объект со всеми возможными удобными полями не нужно. Какие selectors и часто используемые значения стоит добавить, станет понятно при написании реальных Actions. Финальная привязка `ActionContext` к store относится к runtime-документу.

Функция:

- читает переданный context;
- возвращает число;
- не мутирует store и не вызывает world/interaction actions;
- не бросает случайность самостоятельно.

Бросок выполняет движок. Чистая функция только определяет его шанс или вес.

В контракте выше `maxExecutions` пока остаётся обычным числом. Переход к функции для такого поля можно добавить при появлении реального использования; отдельный механизм для каждого числового поля не нужен.

Региональные величины сохраняют согласованные единицы: параметры клетки — `0..999`, конечные уровни POI — целые `0..9`. Функция выбирает нужную величину для конкретного правила. `delta` регионального эффекта не становится уровнем только потому, что его вычисляет функция.

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
const resolvePersuasionChance = ({ state }: ActionContext): number => {
  const relation =
    state.interactionSlice.currentInteraction?.effectiveRelation ?? 0;

  return relation >= 20 ? 1 : 0.4;
};
```

Порог `20` и шанс `0.4` здесь только пример баланса. Путь к данным иллюстрирует чтение существующего state, а не фиксирует будущую структуру slice.

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

Названия конкретных effects в примерах задают их назначение; полный `ActionEffect` будет собираться из нужных проекту обработчиков.

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

Если ресурсов недостаточно, действие disabled и попытка не начинается. Если попытка началась, стоимость списывается и при успехе, и при провале `check`.

Награды и дополнительные последствия выбранной ветки остаются effects. Например, плата за попытку переговоров относится к `cost`, а штраф за угрозу — к `onFail.effects`.

Стоимость может быть динамической. Проверка наличия ресурсов и фактическое списание должны использовать одну разрешённую стоимость конкретной попытки; порядок обеспечивает executor.

## 10. Effects и их цели

Effects описывают изменения игры: инвентарь, параметры персонажей, affection, репутацию, tension, квесты и другие механики. Полный каталог заранее не проектируется.

Для частого случая текущего собеседника и для явной цели используются разные effects. Рабочая форма:

```ts
{ type: 'modifyCurrentNpcAffection', delta: 2 }
{ type: 'modifyNpcAffection', npcId: 'mara', delta: 2 }

{ type: 'modifyCurrentFactionReputation', delta: -1 }
{ type: 'modifyFactionReputation', factionId: 'scavengers', delta: -1 }
```

Текущая цель берётся из interaction-контекста. Явная цель позволяет изменить другого NPC или другую фракцию. Точный resolver текущей фракции нужно сверить при адаптации interaction slice.

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

Effect ставит runtime-пометку. Физическое удаление выполняется централизованно в конце дня. `pendingRemoval` не является полем initial Action или initial POI.

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

| Transition | Значение |
|---|---|
| Не указан | Остаться в текущем Frame |
| `frame` | Открыть указанный Frame в текущем interaction-контексте |
| `root` | Вернуться в root текущего контекста: POI либо slot/NPC |
| `currentPoi` | Перейти в root текущего POI, закончив slot/NPC-контекст; партию не перемещать |
| `parentPoi` | Переместить партию в родительский POI/клетку |
| `poi` | Переместить партию в указанный POI |
| `trade` | Открыть торговлю; текущий Frame сохраняется |
| `combat` | Запустить бой |

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
  text: string;
}

export interface ThoughtLine {
  thought: string;
}

export type NarrativeBlock = string | DialogueLine | ThoughtLine;
```

```ts
narrative: [
  '{$npc} отставляет кружку.',
  { speakerId: '$npc', text: 'Что ты хочешь узнать?' },
  { thought: 'Кажется, он что-то скрывает.' },
],
```

`$npc` — NPC текущего slot-контекста. `{$npc}` подставляет имя знакомого NPC либо название роли незнакомого. Подстановка выполняется один раз при создании log event; в log сохраняются конкретные значения.

ActionResult использует presentation исходного Frame. При переходе narrative нового Frame получает presentation нового Frame. Детали хранения snapshots вынесены в runtime-документ.

Обычному выходу из POI не требуется специальный narrative.

## 13. Дневные ограничения

```ts
maxExecutions: 1,
```

Это максимум начатых попыток **за игровой день**, включая провал проверки. Выход и повторный вход не сбрасывают лимит.

Ключ ограничения: **subject + actionId**. Subject — конкретный NPC в slot-контексте либо конкретный экземпляр POI в POI-контексте. `frameId` в ключ не входит.

Следствия для контента:

- два encounter с одним template имеют независимые счётчики;
- одно персональное действие у разных NPC имеет независимые счётчики;
- один Action в разных Frames одного subject использует общий счётчик;
- два разных сундука у одного subject требуют разных Action IDs, если попытки должны учитываться независимо.

Общие definitions и фабрики позволяют переиспользовать логику, сохранив разные IDs действий.

Постоянный `maxTotalExecutions` сейчас не вводится. Долговременные последствия представляются состоянием самой механики — квестом, предметами, существованием POI и т. п. Для временного тайника дневного ограничения и последующего удаления POI достаточно.

## 14. Пример согласованного набора Actions

```ts
// Defaults:
// conditions/requirements отсутствуют — соответствующих ограничений нет.
// appearanceChance отсутствует — 1.
// cost отсутствует — нет затрат.
// maxExecutions отсутствует — нет дневного лимита.
// narrative/effects отсутствуют — ничего не добавляют.
// transition отсутствует — текущий Frame сохраняется.

export const RED_BOAR_ACTIONS = {
  'redBoar:buyDrink': {
    label: 'Купить выпивку',
    cost: { money: 5, time: 15 },
    result: {
      narrative: ['Выпивка обжигает горло.'],
      effects: [{ type: 'modifyPartyStamina', delta: 5 }],
    },
  },

  'bartender:askRumors': {
    label: 'Спросить о слухах',
    maxExecutions: 1,
    result: {
      narrative: [
        { speakerId: '$npc', text: 'У восточных руин снова видели чужаков.' },
      ],
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
    maxExecutions: 1,
    check: {
      type: 'chance',
      chance: resolvePersuasionChance,
      onSuccess: {
        narrative: [
          { speakerId: 'bob', text: 'Он спустился в подвал. Начни оттуда.' },
        ],
        effects: [{
          type: 'setQuestStage',
          questId: 'missingCourier',
          stageId: 'searchCellar',
        }],
        transition: { type: 'root' },
      },
      onFail: {
        narrative: [{ speakerId: 'bob', text: 'Я не хочу в это ввязываться.' }],
        effects: [{ type: 'modifyCurrentNpcAffection', delta: -2 }],
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

1. Дополнить существующий `ActionCondition` временем суток и квестовыми проверками, согласовав точные поля с типами времени и quests.
2. Расширять `ActionEffect` по реальным механикам; не пытаться сейчас перечислить все возможные effects.
3. При работе с quests окончательно согласовать передачу quest context в глобальные Actions и эффекты; в примерах используется явный `questId`.
4. При проектировании runtime определить окончательный `ActionContext`, selectors, тип исполнителя проверки и единый resolver чисел.

Место обработки transitions, дневная память, appearance rolls, порядок исполнения, послебоевой возврат, удаление POI и нерешённые детали движка собраны в `interaction-runtime-engine-questions.md`. Отдельное поле автоуспеха не требуется.
