# Interaction / Frame / Action Design

## 0. Мотивация

Текущая система POI и services построена по простой прямой схеме:

```text
действие → результат
```

Это хорошо работает для обычных действий:

```text
купить предмет
отдохнуть
выпить
получить лечение
```

Но этого недостаточно для более сложных взаимодействий, особенно для квестов.

В квестовой сцене часто требуется последовательность:

```text
показать ситуацию
→ дать несколько вариантов ответа
→ выполнить проверку характеристики или навыка
→ получить success или fail
→ изменить состояние квеста
→ перейти к следующему набору вариантов
```

Также один ответ может вести в разные ветки диалога или вообще закрывать взаимодействие.

В текущей модели service сразу выполняет результат и не имеет собственного контекста продолжения. Поэтому ветвление пришлось бы реализовывать отдельно: через специальную систему диалогов, ручные флаги, замену services или жёсткую логику внутри UI.

Цель изменения — не усложнить обычные POI-действия, а расширить существующую модель так, чтобы она поддерживала и простые действия, и последовательные ветвящиеся сцены.

```text
простое действие:
Action → ActionResult

ветвящаяся сцена:
Frame → Action → ActionResult → следующий Frame
```

При этом:

```text
Frame не является новым POI
Frame не является persistent-объектом мира
Frame сам не применяет effects
```

Frame только описывает текущее состояние interaction: текст, изображение и доступные действия.

Корневой frame может полностью повторять нынешнее поведение POI services. Поэтому существующие services можно переносить постепенно:

```text
старый service = action в root frame
```

---

## 1. Основная идея

Не держать отдельно несколько похожих систем:

```text
services
dialogue choices
scene buttons
POI actions
```

Всё сводится к одной модели:

```text
Interaction = текущая сессия взаимодействия с POI/NPC
Frame       = текущий экран/кадр внутри interaction
Action      = кнопка, которую игрок может нажать
```

`service` становится старым названием для action в корневом кадре.

```text
service = action в root frame
choice  = action в любом другом frame
```

---

## 2. Frame

Frame — пассивная сущность. Он сам ничего не меняет в мире.

```ts
interface InteractionFrame {
  narrative?: NarrativeBlock[];
  imageUrl?: string;
  actions: InteractionAction[];
}
```

Смысл полей:

```text
narrative = текст текущей ситуации
imageUrl  = картинка текущей ситуации, опционально
actions   = доступные действия
```

Пока не решаем проблему спама narrative при возврате во frame. Если при переходах туда-сюда текст начнёт раздражающе повторяться, позже можно добавить `seenFrameIds`.

Главное техническое правило: переход во frame должен идти через одну функцию.

```ts
enterFrameDraft(state, frameId)
```

Сейчас она может просто делать:

```text
activeFrameId = frameId
log += frame.narrative
```

Позже туда можно будет добавить антиспам, не переписывая всю систему.

---

## 3. Action

Action бывает двух типов:

```text
DirectAction  = обычное действие без проверки
CheckedAction = действие с проверкой
```

Не разрешаем одновременно `result` и `check`, чтобы не было путаницы порядка выполнения.

```ts
type InteractionAction =
  | DirectInteractionAction
  | CheckedInteractionAction;
```

Общая база action:

```ts
interface BaseInteractionAction {
  id: string;
  label: string;

  visibilityConditions?: InteractionCondition[];
  cost?: ActionCost;

  maxExecutions?: number;
}
```

`maxExecutions` — это часть definition, но количество выполнений должно храниться в runtime state interaction session.

---

## 4. DirectAction

Обычное действие без проверки.

```ts
type DirectInteractionAction = BaseInteractionAction & {
  result: ActionResult;
  check?: never;
};
```

Пример:

```ts
{
  id: 'acceptJob',
  label: 'Take the job',
  result: {
    narrative: ['You agree to help Mara.'],
    effects: [
      { type: 'setQuestStage', stageId: 'bringFood' },
    ],
    route: { type: 'returnToRoot' },
  },
}
```

---

## 5. CheckedAction

`onSuccess` и `onFail` живут внутри `check`, потому что без проверки они не имеют смысла.

```ts
type CheckedInteractionAction = BaseInteractionAction & {
  check: ActionCheck;
  result?: never;
};
```

```ts
type ActionCheck =
  | {
      type: 'stat';
      statId: MainStatKey;
      difficulty: number;
      onSuccess: ActionResult;
      onFail: ActionResult;
    }
  | {
      type: 'skill';
      skillId: SkillKey;
      difficulty: number;
      onSuccess: ActionResult;
      onFail: ActionResult;
    }
  | {
      type: 'difficulty';
      difficulty: number;
      onSuccess: ActionResult;
      onFail: ActionResult;
    };
```

Пример:

```ts
{
  id: 'askForMoreMoney',
  label: 'Ask for more money',

  check: {
    type: 'skill',
    skillId: 'charisma',
    difficulty: 40,

    onSuccess: {
      narrative: ['Mara reluctantly agrees to pay more.'],
      effects: [
        { type: 'setQuestVar', key: 'rewardBonus', value: 20 },
      ],
      route: { type: 'goToFrame', frameId: 'maraOffer' },
    },

    onFail: {
      narrative: ['Mara gets annoyed.'],
      effects: [
        { type: 'modifyTension', delta: 10 },
      ],
      route: { type: 'goToFrame', frameId: 'maraOffer' },
    },
  },
}
```

---

## 6. ActionResult

Результат действия состоит из трёх частей:

```ts
interface ActionResult {
  narrative?: NarrativeBlock[];
  effects?: ActionEffect[];
  route?: ActionRoute;
}
```

Смысл:

```text
narrative = что добавить в log
effects   = что изменить в мире/квестах/персонажах
route     = куда перейти внутри interaction
```

---

## 7. Route отдельно от effects

Маршрутизацию лучше не класть в effects.

```ts
type ActionRoute =
  | { type: 'stay' }
  | { type: 'goToFrame'; frameId: string }
  | { type: 'returnToRoot' }
  | { type: 'closeInteraction' };
```

Причина:

```text
effects меняют состояние игры
route управляет текущим interaction UI
```

Примеры effects:

```text
modifyTension
setQuestStage
addItem
damageParty
```

Примеры route:

```text
goToFrame
returnToRoot
closeInteraction
```

---

## 8. Cost

`cost` — отдельная сущность. Это не `visibilityCondition` и не обычный `effect`.

```ts
interface ActionCost {
  money?: number;
  stamina?: number;
  time?: number;

  items?: {
    itemId: string;
    count: number;
  }[];
}
```

Правило:

```text
cost = единственный источник правды
```

Не делать так:

```ts
visibilityConditions: [{ type: 'money', min: 200 }],
effects: [{ type: 'removeMoney', amount: 200 }]
```

Делать так:

```ts
cost: {
  money: 200,
  time: 120,
}
```

Executor сам:

```text
1. проверяет, хватает ли ресурсов
2. списывает cost при выполнении action
```

Важное правило: если action начал выполняться, `cost` списывается всегда, независимо от результата `check`.

Например, если игрок тратит выносливость и время на попытку переплыть реку, провал проверки не должен отменять эту трату.

---

## 9. Порядок выполнения action

Рабочий порядок:

```text
1. проверить visibilityConditions
2. проверить cost
3. если есть check — выполнить check и выбрать ActionResult: onSuccess или onFail
4. применить cost
5. применить effects выбранного ActionResult
6. записать log events: check result, cost summary, effect summaries, narrative
7. применить route выбранного ActionResult
```

`route` всегда последним.

`cost` применяется после выбора ветки success/fail, но не зависит от этой ветки. Он списывается и при успехе, и при провале.

---

## 10. Interaction log

Лог лучше хранить не как простой `NarrativeBlock[]`, а как список событий.

```ts
type InteractionLogEvent =
  | {
      type: 'narrative';
      blocks: NarrativeBlock[];
    }
  | {
      type: 'check';
      actionId: string;
      outcome: 'success' | 'fail';
      statId?: MainStatKey;
      skillId?: SkillKey;
      difficulty: number;
      value: number;
      roll?: number;
    }
  | {
      type: 'cost';
      cost: ActionCost;
    }
  | {
      type: 'effectSummary';
      items: EffectSummaryItem[];
    };
```

Зачем это нужно:

```text
narrative      = художественный текст
check          = результат проверки / броска
cost           = что было списано
effectSummary  = что изменилось после effects
```

UI сможет рендерить не только голый текст, но и системные строки, кубики, иконки предметов, изменение репутации, полученный лут и т.п.

Если на первом этапе это слишком много, можно временно хранить только `narrative`, но лучше сразу не называть поле `NarrativeBlock[]`, чтобы потом не ломать типы.

---

## 11. Runtime interaction state

Минимальный runtime state:

```ts
interface InteractionSession {
  activeFrameId: string;
  log: InteractionLogEvent[];

  actionExecutionCounts: Record<string, number>;
}
```

`actionExecutionCounts` нужен для `maxExecutions`.

Базовое правило для ключа:

```text
actionId должен быть уникален внутри interaction definition
```

Тогда можно хранить просто:

```ts
actionExecutionCounts[action.id]
```

Если action id может повторяться в разных frame-ах, нужен составной ключ:

```ts
const executionKey = `${frameId}:${action.id}`;
```

Пока проще требовать уникальные action id внутри одной interaction/scene.

### Локальный или глобальный счётчик

По умолчанию `actionExecutionCounts` — локальный state текущей interaction session.

Значит при `closeInteraction` счётчики сбрасываются.

Это подходит для ограничений вроде:

```text
можно спросить эту реплику 1 раз в текущем разговоре
можно нажать testService максимум 3 раза в этой сессии
```

Если ограничение должно жить дольше, его не надо хранить в `InteractionSession`. Тогда это уже persistent state POI/NPC/quest/world.

Примеры:

```text
сундук можно открыть только один раз навсегда
бармен выдаёт слух один раз в день
quest dialogue branch можно выбрать один раз за весь квест
```

Для таких случаев нужны отдельные flags/counters в POI/NPC/quest state, а action должен проверять их через `visibilityConditions` или effects.

Позже, если narrative начнёт спамиться при переходах туда-сюда, можно добавить:

```ts
seenFrameIds?: Record<string, true>;
```

Сейчас это не добавляем.

---

## 12. Главная граница ответственности

```text
Frame        описывает текущую ситуацию.
Action       описывает выбор игрока.
ActionResult описывает последствия выбора.
Route        двигает внутри interaction.
Effects      меняют игру.
POI          остаётся persistent объектом мира.
```

Это ядро модели.
