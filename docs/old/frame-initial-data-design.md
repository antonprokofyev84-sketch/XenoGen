# Initial Frame Data Design

## Статус и область документа

Документ описывает только immutable initial-данные Frames:

- форму `InitialFrame`;
- хранение и группировку Frame definitions;
- ответственность Frame;
- связь root Frames с POI template и slots;
- данные фона, показа NPC, narrative и Actions;
- правила композиции Actions для root Frames.

Runtime interaction state, Zustand slices, сохранение дневной памяти, выполнение Actions, transitions, логика переходов и UI-анимации намеренно вынесены в отдельный документ `interaction-runtime-engine-questions.md`.

Термин `Scene` пока не используется. Возможное переименование `Interaction` будет рассматриваться отдельно.

---

## 1. Хранение Frames

Все Frame definitions доступны через общий плоский registry:

```ts
export const INITIAL_FRAMES: Record<FrameId, InitialFrame>;
```

Это не означает, что весь контент должен находиться в одном физическом файле. Frames можно группировать по POI, encounter, quest или другому содержательному модулю, а затем объединять в одном `index.ts`.

Возможная файловая структура:

```text
src/data/initial/frames/
  poi/
    redBoar.frames.ts
    dustTown.frames.ts
  encounters/
    scavengerGroup.frames.ts
  quests/
    missingCourier.frames.ts
  index.ts
```

Конкретная структура директорий не является частью контракта. Контрактом является единый итоговый `INITIAL_FRAMES`.

Как и в остальных initial-файлах, в начале файлов с Frame definitions обязательно перечисляются defaults всех optional-полей. При добавлении нового optional-поля комментарий обновляется одновременно с типом.

---

## 2. Frame ID

`FrameId` является ключом registry. Поле `id` внутри `InitialFrame` не хранится:

```ts
export const RED_BOAR_FRAMES = {
  redBoar: {
    // Нет id: 'redBoar'.
  },
} satisfies Record<FrameId, InitialFrame>;
```

Для системных context Frames используется компактная грамматика:

```text
POI context  = templateId
slot context = templateId/slotId

root Frame   = contextId
другой Frame = contextId:framePath
```

Пример:

```text
redBoar                          POI root
redBoar:closed                   будущий closed Frame POI
redBoar:forceExit                forceExit Frame POI
redBoar:askOwner                 внутренний Frame POI

redBoar/bartender                slot root
redBoar/bartender:closed         возможный closed Frame slot
redBoar/bartender:forceExit      forceExit Frame slot
redBoar/bartender:askAboutMara   внутренний Frame slot
```

Символ `/` отделяет `slotId` от `templateId`, а `:` отделяет конкретный Frame от его контекста. Поэтому `/` и `:` не используются внутри `templateId`, `slotId` и отдельных сегментов `framePath`.

Суффикс `root` не используется. Идентификатор самого контекста одновременно является идентификатором его root Frame.

NPC ID в имени slot root отсутствует. Конкретный NPC определяется runtime occupancy и interaction-контекстом.

Имена `closed` и `forceExit` зарезервированы для системных Frames соответствующего контекста. Наличие такой записи в `INITIAL_FRAMES` не обязательно: например, отдельный closed Frame на первом этапе не используется.

Обычные контентные Frames могут именоваться через владельца контента, а не через место показа:

```text
redBoar:missingCourier:question   Frame квеста, принадлежащий POI
bob:missingCourier:question       Frame квеста, принадлежащий NPC

ann:intro                         универсальное представление Ann
redBoar:intro:ann                 представление Ann, специфичное для таверны
```

Доступность такого Frame определяется Actions, quests и entry rules отдельно. `FrameId` не используется для восстановления runtime interaction-контекста: актуальные `poiId`, `slotId` и `npcId` хранятся отдельно.

---

## 3. Ответственность Frame

Frame является пассивным описанием отображаемого состояния.

Frame может задавать:

- background;
- правило отображения NPC поверх background;
- narrative при входе;
- ссылки на собственные Actions.

Frame не содержит:

- runtime-состояние;
- проверки характеристик или навыков;
- costs;
- effects;
- transitions;
- conditions;
- execution counters;
- состояние конкретного POI или NPC.

Conditions, checks, costs, effects и дальнейший flow принадлежат Actions и ActionResults. Состояние конкретного экземпляра относится к runtime interaction state.

---

## 4. Предварительная структура InitialFrame

```ts
export type NpcDisplayMode =
  | 'none'
  | 'speaker'
  | 'always';

export interface InitialFrame {
  background?: string;
  npcDisplay?: NpcDisplayMode;
  narrative?: NarrativeBlock[];
  actionIds?: ActionId[];
}
```

Defaults:

```text
background отсутствует → не менять текущий background
npcDisplay отсутствует → использовать speaker
narrative отсутствует  → Frame не добавляет narrative
actionIds отсутствует  → у Frame нет собственных Actions
```

---

## 5. Background

Background является presentation-данными Frame.

Только Frame может задавать или менять background. На текущем этапе background не хранится:

- в POI template;
- в Action;
- в ActionResult;
- в NarrativeBlock;
- в effects или transitions.

```ts
interface InitialFrame {
  background?: string;
}
```

Background не является обязательным, включая POI root и slot root.

Если `background` отсутствует, Frame не меняет текущий background. При начале нового interaction предыдущий background сбрасывается, поэтому первый Frame без background может отображаться без изображения. На первом этапе это допустимо.

В TypeScript initial-файлах предпочтителен статический импорт asset:

```ts
import redBoarMain from '@/assets/backgrounds/red-boar/main.webp';

export const RED_BOAR_FRAMES = {
  redBoar: {
    background: redBoarMain,
  },
} satisfies Record<FrameId, InitialFrame>;
```

Для `InitialFrame` результат импорта остаётся обычной строкой URL. Отдельный registry backgrounds пока не вводится. Сырой путь также допустим, если asset хранится в `public`, но статический import позволяет Vite проверить наличие файла и обработать его при production build.

---

## 6. Narrative blocks

На текущем этапе фиксируется компактная структура без обязательного discriminant `type` для каждого блока:

```ts
export interface DialogueLine {
  speakerId: CharacterId | '$npc';
  text: string;
}

export interface ThoughtLine {
  thought: string;
}

export type NarrativeBlock =
  | string
  | DialogueLine
  | ThoughtLine;
```

Семантика:

```text
string                  → описание ситуации
{ speakerId, text }     → прямая речь персонажа
{ thought }             → мысль протагониста
```

Пример:

```ts
narrative: [
  'The tavern falls silent.',
  {
    thought: 'Something is wrong here.',
  },
  {
    speakerId: 'bob',
    text: 'What do you want?',
  },
],
```

Helpers вида `description(...)`, `thought(...)` и `speak(...)` не являются частью initial-формата.

Для NPC текущего slot-контекста используется специальная ссылка `$npc`:

```ts
{
  speakerId: '$npc',
  text: 'What do you want?',
}
```

Для подстановки его отображаемого имени в текст используется placeholder `{$npc}`:

```ts
'{$npc} sits alone at the table.'
```

При создании runtime log event значения разрешаются один раз:

```text
speakerId: '$npc' → конкретный npcId
{$npc}            → имя знакомого NPC либо название роли незнакомого NPC
```

В log сохраняются уже разрешённые значения. Использование `$npc` или `{$npc}` без `npcId` в interaction-контексте является ошибкой initial-данных.

---

## 7. Отображение NPC

Frame должен иметь один простой режим, управляющий NPC overlays поверх background.

Зафиксированы три режима:

```ts
export type NpcDisplayMode =
  | 'none'
  | 'speaker'
  | 'always';
```

```text
none    → не показывать NPC overlays
speaker → показывать NPC, произносящего текущую реплику
always  → постоянно показывать npcId текущего slot-контекста
```

В режиме `always` другой speaker может отображаться дополнительно. Если говорит основной NPC, второй экземпляр его изображения не создаётся.

Default — `speaker`. Режим `always` без `npcId` в текущем контексте является ошибкой initial-данных.

Положение персонажей, момент смены speaker, поведение при реплике основного NPC и данные, сохраняемые в логе, являются runtime/presentation-вопросами и вынесены в отдельный документ.

---

## 8. Frame Actions

Frame хранит только ссылки на собственные Action definitions:

```ts
interface InitialFrame {
  actionIds?: ActionId[];
}
```

Сами Actions хранятся отдельно. Frame не встраивает Action objects.

Conditions находятся в Actions, а не во Frame.

### POI root

Итоговое содержимое POI root складывается из следующих источников:

```text
frame.actionIds
+ poi.actionIds
+ quest actions, привязанные именно к poiId
+ interactions с NPC из заполненных slots
+ переходы в открытые и доступные дочерние POI
```

### Slot root

Итоговое содержимое slot root складывается из:

```text
frame.actionIds
+ slot.actionIds
+ quest actions, привязанные именно к npcId текущего occupant
+ npc.actionIds
```

POI quest actions не подмешиваются в slot root. NPC quest actions не подмешиваются в POI root.

Interactions со slots и переходы к дочерним POI могут позднее отображаться не только кнопками, но также портретами, карточками или интерактивными элементами поверх background. Их runtime/UI-представление не меняет источники root-контента и не является частью `InitialFrame`.

Внутренний Frame использует только собственные `frame.actionIds`. POI, slot, NPC и quest Actions динамически подмешиваются только в соответствующие root Frames. Это не позволяет общим root-возможностям внезапно появляться внутри конкретной авторской ветки.

---

## 9. Entry redirects

Frame не содержит `condition`, `isIntro`, `once` или другие правила автоматического выбора.

При входе в POI либо slot движок может открыть не root, а альтернативный стартовый Frame: первое знакомство с NPC, постановочный квестовый эпизод, локальное событие или `forceExit`.

Сам альтернативный Frame является обычной записью в `INITIAL_FRAMES`:

```ts
'redBoar:gangConflict:intro': {
  background: gangConflictIntro,
  npcDisplay: 'none',
  narrative: [
    'A frightened man rushes toward you as soon as you enter.',
  ],
  actionIds: [
    'gangConflict:intro:continue',
  ],
},
```

Условия и порядок выбора стартового Frame находятся в отдельной системе entry rules. Их initial-форма и runtime-разрешение вынесены в `interaction-runtime-engine-questions.md`.

Entry rule указывает только первый Frame события. Переходы между последующими Frames выполняются Actions.

---

## 10. Закрытые POI

На первом этапе отдельный closed Frame не используется.

Если POI закрыт по расписанию:

```text
переход к POI остаётся видимым
→ элемент перехода disabled
→ отображается пометка «Закрыто»
→ interaction с закрытым POI не начинается
```

Отдельный closed Frame, взлом, проникновение и кража отложены. При необходимости в будущем используются IDs вида:

```text
redBoar:closed
redBoar/bartender:closed
```

---

## 11. Зафиксировано

- Frames являются immutable initial definitions и доступны через общий `INITIAL_FRAMES` registry.
- Registry можно собирать из нескольких файлов, сгруппированных по POI, encounters и quests.
- `FrameId` хранится только как ключ registry; поля `id` внутри Frame нет.
- POI root имеет ID, равный `templateId`, например `redBoar`.
- Slot root имеет ID `templateId/slotId`, например `redBoar/bartender`, и не содержит NPC ID.
- Суффикс `root` не используется; `:` отделяет локальный Frame от context ID.
- `closed` и `forceExit` являются зарезервированными именами системных context Frames.
- Контентные Frames могут именоваться через владельца контента, например `redBoar:missingCourier:question` или `bob:missingCourier:question`.
- Frame является пассивным presentation-состоянием и не содержит runtime, conditions, checks, costs, effects или transitions.
- Background принадлежит только Frame, остаётся optional и может передаваться результатом статического asset import.
- При новом interaction background сбрасывается; отсутствие background в следующем Frame означает не менять текущий.
- Narrative использует `string | DialogueLine | ThoughtLine`; `speakerId: '$npc'` ссылается на NPC текущего slot-контекста.
- Placeholder `{$npc}` разрешается в отображаемое имя или роль при создании log event.
- `npcDisplay` использует `none | speaker | always`, default — `speaker`.
- Frame хранит ссылки `actionIds`, а Action definitions находятся отдельно.
- Conditions принадлежат Actions.
- Источники содержимого POI root и slot root определены отдельно.
- Внутренний Frame использует только собственные `frame.actionIds`.
- Автоматический выбор альтернативного стартового Frame выполняется отдельными entry rules, а не самим Frame.
- На первом этапе закрытый POI показывается disabled-переходом без отдельного closed Frame.
- Все defaults initial-файла обязательно перечисляются в комментарии в его начале.

---

## 12. Открытые вопросы initial-формата

1. Нужны ли Frame-specific локальные IDs Actions либо все Action IDs остаются глобальными.
2. Потребуется ли позднее отдельный background registry, если у изображений появятся metadata, preload, variants или fallbacks. Сейчас он не используется.
3. Окончательная initial-форма entry rules и общего `Condition` будет определена вместе с Actions.
