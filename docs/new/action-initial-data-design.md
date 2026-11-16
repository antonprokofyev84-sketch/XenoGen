# Actions

Формат: [action.types.ts](../../src/types/action.types.ts),
[условия](../../src/types/condition.types.ts), [effects](../../src/types/gameEffect.types.ts).
Реестр: `src/data/initial/actions.ts`.
[Порядок исполнения и времени](interaction-runtime-state-design.md#исполнение-action).

## Definition

Action задаёт `label` и один из вариантов:

- `result`: один результат или массив взвешенных результатов;
- `check`: проверка `stat`, `skill` или `chance` с обязательными `onSuccess` и `onFail`.

Результат содержит `narrative`, `effects` и `transition`. Пустой результат `{}`
допустим. `category` определяет иконку: `dialogue`, `quest`, `trade`, `rest`,
`interaction`; default — `interaction`, квестовый источник получает `quest`.
ID Action — ключ `INITIAL_ACTIONS`; один definition можно использовать в разных Frames.

## Видимость, доступность и расходы

| Поле | Назначение | Результат невыполнения |
| --- | --- | --- |
| `conditions` | Условия появления | Скрыть Action |
| `appearanceChance` | Дневной шанс появления | Скрыть Action |
| `requirements` | Требования выполнения | Disabled |
| `cost` | Обязательные расходы попытки | Disabled при нехватке |
| `executionLimit` | `perDay` и/или `total` попыток | Disabled при исчерпании |

Массивы условий работают как AND. Числовые `min`/`max` включительны, `exact`
проверяет равенство. `questVar` использует `equals` либо `notEquals`;
отсутствующая переменная сравнивается как `undefined`. `questStatus` проверяет статус.
Числовое условие задаёт хотя бы одну границу: `exact` используется самостоятельно,
а для пары `min`/`max` требуется `min <= max`.

`affection` без `npcId` адресует текущего NPC. `reputation` без `factionId`
адресует фракцию текущего NPC либо текущего POI. Явный ID переопределяет цель.
`regionLevel` проверяет итоговый уровень текущего POI.
`defeated.baselineFromVar` вычитает сохранённый квестовый baseline из общего числа побед.

Стоимость задаётся `money`, `items`, личной `stamina` протагониста и минутами
`time`. Расходуемый предмет описывай в `cost.items`; простое наличие — условием.
Один и тот же платёж задаётся одним cost. Для восстановления stamina используется
`modifyPartyStamina`; его цель — участники партии.

Незаполненные optional-условия, расходы и лимиты означают свободное выполнение;
`appearanceChance` по умолчанию равен 1. Дневная память описана в
[runtime](interaction-runtime-state-design.md#память-исполнения).

## Checks и выбор результата

`chance` — вероятность `0..1`; `stat`/`skill` используют соответствующий roll service
и `difficulty`. Обе ветки check могут содержать взвешенные результаты.
У каждого варианта явно задаётся `weight`; из набора выбирается один вариант
пропорционально весу. Нулевой вес исключает вариант.

`ActionNumber` задаёт число либо чистую функцию `ActionContext`. Это применяется
к стоимости, шансам, сложности и весам. Доступный контекст перечислен в типе;
гарантированный успех выражается `chance: 1`.

## Transitions и цели effects

| Transition | Назначение |
| --- | --- |
| `frame` | Открыть `frameId` |
| `root` | Вернуться в root текущего контекста |
| `currentPoi` | Открыть root текущего POI без travel |
| `parentPoi` | Перейти к родителю текущего POI |
| `poi` | Перейти в конкретный `poiId` |
| `trade` | Открыть торговую модалку в текущем Frame |
| `combat` | Точка интеграции [боевого сценария](ideas.md) |

Без transition действие остаётся в текущем Frame. Optional `transition.time`
подчиняется [контракту времени](interaction-runtime-state-design.md#время-перехода).

Quest effects указывают `questId` явно. Структурные effects с `poiId` принимают
конкретный ID или `$currentPoi`; `markCurrentPoiForRemoval` адресует текущий POI.
`modifyTension` адресует текущего NPC; inventory effects — инвентарь протагониста.
Полный список дескрипторов находится в типе `Effect`, семантика — у владельца механики.
Контекстные цели требуют фактического POI/NPC. Для `onDayPass` текущий POI —
владелец эффекта; глобальный quest timer выполняет effects без interaction-контекста,
поэтому обращение к POI в нём задаётся явным `poiId`.

## Пример

```ts
askForHelp: {
  label: 'Ask for help',
  category: 'dialogue',
  cost: { stamina: 2 },
  check: {
    type: 'chance',
    chance: ({ effectiveRelation = 0 }) => effectiveRelation >= 20 ? 1 : 0.4,
    onSuccess: { narrative: [{ speakerId: '$npc', text: 'I can help.' }] },
    onFail: { narrative: [{ speakerId: '$npc', text: 'Not today.' }] },
  },
}
```
