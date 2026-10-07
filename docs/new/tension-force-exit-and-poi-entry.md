# Tension, force exit и доступ к POI

## Статус

Документ фиксирует принятое поведение дневного `tension`, принудительного завершения взаимодействия с NPC и блокировки входа в POI.

## Дневной tension NPC

- `tension` по умолчанию принадлежит конкретному NPC, а не POI.
- При первом взаимодействии с NPC в течение дня начальный `tension` рассчитывается из актуального эффективного отношения и одного случайного целого отклонения в диапазоне `[-20, 20]`.
- Эффективное отношение учитывает личное отношение NPC, репутацию игрока у его фракции и loyalty-профиль NPC.
- Полученное значение сохраняется в дневной памяти NPC и используется при всех повторных взаимодействиях с ним в тот же день.
- В конце дня дневная запись удаляется. При первом взаимодействии следующего дня начальный `tension` рассчитывается заново из уже актуальных отношений.
- Постоянные последствия конфликта должны отдельно изменять личное отношение, репутацию, квестовое состояние или состояние POI. Сам дневной `tension` таких последствий не создаёт.

За базу берётся формула из текущей реализации с исправленным знаком и ограничением итогового диапазона:

```ts
const randomOffset = Math.floor(random() * 41) - 20;
const initialTension = clamp(-effectiveRelation + randomOffset, 0, 100);
```

`effectiveRelation` сохраняет формулу текущего `resolveEffectiveRelation`:

```ts
const factionWeight = 1 - personalWeight;
const effectiveRelation = personalAffection * personalWeight + factionReputation * factionWeight;
```

`personalWeight` берётся из loyalty-профиля фракции NPC и находится в `0..1`. В текущем `computeInitialTension` использовалось `effectiveRelation + randomOffset`, из-за чего хорошее отношение ошибочно повышало напряжение, а результат не ограничивался ожидаемым диапазоном. Поэтому знак инвертируется и добавляется `clamp`.

Текущий `startInteractionDraft` пока получает фракцию NPC и affection через временные заглушки (`neutral` и `0`). Эти заглушки не являются частью формулы и не переносятся: новый runtime читает фактические `npc.faction`, affection NPC и репутацию игрока у этой фракции. Для NPC без фракции используется чисто личное отношение (`personalWeight = 1`, faction contribution `0`), без вымышленного faction ID. Конкретный числовой порог `forceExit` остаётся отдельной балансной константой.

## Force exit из взаимодействия с NPC

`forceExit` представлен системным элементом той же pending-очереди, в которой исполняются authored Interceptors, но сам не является записью `INITIAL_INTERCEPTORS`. Runtime проверяет порог после первого расчёта или восстановления дневного tension при входе, а также после полного применения результата Action/Interceptor, содержащего `modifyTension`. Проверка не вклинивается между отдельными effects одного результата. При достижении порога runtime идемпотентно заменяет оставшуюся authored-очередь единственным system `forceExit` item. Открытый внутренний Frame не прерывается: системный элемент исполняется только после возврата в root актуального контекста.

Базовый исход при достижении порога `tension`:

```text
slot/NPC context → currentPoi
```

Игрок прекращает разговор и возвращается в root текущего POI. Остальные возможности POI автоматически не блокируются.

Если для slot/NPC-контекста существует reserved Frame `<templateId>/<slotId>:forceExit`, system item открывает его. Обычные Actions этого Frame определяют дальнейший исход. Поэтому контент может явно задать более сильный вариант:

```text
slot/NPC context → parentPoi
```

Например, хозяин дома может выставить игрока за дверь. Action внутри force-exit Frame применяет эффект блокировки входа и выполняет переход в родителя.

Если reserved Frame отсутствует, используется системный fallback без authored result: slot/NPC context возвращается в `currentPoi`. POI-context force exit в этой миграции не используется. Переход в `currentPoi` или `parentPoi` внутри существующего force-exit Frame остаётся обычным Action transition. Блокировка POI остаётся отдельным effect.

## Состояние доступа к POI

Доступность входа принадлежит runtime-состоянию самого POI. Родительский POI строит навигацию по состоянию своих дочерних POI и не читает для этого interaction memory.

```ts
interface PoiDetails {
  /**
   * Постоянная блокировка нового входа.
   * Отсутствие поля означает false.
   */
  isEntryDisabled?: true;

  /**
   * Временная блокировка нового входа.
   * Значение 1 означает блокировку до ближайшего конца дня.
   */
  entryDisabledDaysLeft?: number;
}
```

`isEntryDisabled` хранится только в состоянии `true`. Разрешение входа удаляет поле, поэтому `undefined` корректно означает `false` и не требует явного начального значения для каждого POI.

`entryDisabledDaysLeft` использует ту же семантику оставшихся дней, что и другие дневные счётчики мира:

```text
поле отсутствует → временной блокировки нет
1                 → вход запрещён до ближайшего конца дня
2                 → остаток текущего дня и весь следующий день
```

При общем `onDayEnd` обрабатываются все зарегистрированные дневные счётчики мира, включая `entryDisabledDaysLeft`. Значение уменьшается на один, а при достижении нуля поле удаляется. Для добавления нового счётчика не создаётся отдельный дневной pipeline: он подключается к той же общей фазе со своим правилом нулевого состояния.

Структурные effects доступа первой версии:

```ts
interface DisablePoiEntryForDaysEffect {
  type: 'disablePoiEntryForDays';
  poiId: PoiId | '$currentPoi';
  days: number;
}

interface SetPoiEntryDisabledEffect {
  type: 'setPoiEntryDisabled';
  poiId: PoiId | '$currentPoi';
  disabled: boolean;
}
```

`days` является положительным целым числом. `setPoiEntryDisabled(..., false)` удаляет optional-поле `isEntryDisabled`, а не сохраняет `false`.

## Разрешение навигации

Для обнаруженного дочернего POI переход остаётся видимым, но становится disabled, если выполняется хотя бы одно из условий:

- `isEntryDisabled === true`;
- `entryDisabledDaysLeft > 0`;
- POI закрыт по текущему `schedule`.

`pendingRemoval` сохраняет отдельную ранее принятую семантику: такой POI не предлагается для нового входа, а не отображается как обычный disabled-переход.

Причина disabled определяется runtime resolver:

```text
schedule closed              → «Закрыто»
isEntryDisabled              → «Вход недоступен»
entryDisabledDaysLeft > 0    → «Вас сюда не пускают»
```

Блокировка входа:

- действует только на новый переход в POI;
- не прерывает уже выполняющийся Action или внутренний Frame;
- не запрещает выход из POI;
- не очищает occupancy;
- не выгоняет работников и других NPC;
- не останавливает `onDayPass`;
- не удаляет POI и не блокирует рекурсивно его дочерние POI.

## Типовые сценарии

### Обычный конфликт с NPC

```text
reserved force-exit Frame отсутствует
→ system fallback: currentPoi
```

### Хозяин выставляет игрока из дома

```text
Action в <contextId>:forceExit:
  effects: отсутствуют
  transition: parentPoi
```

### Бармен выгоняет игрока до конца дня

```text
Action в <contextId>:forceExit:
  effects:
    { type: 'disablePoiEntryForDays', poiId: '$currentPoi', days: 1 }
  transition:
    parentPoi
```

### Дом мэра известен, но пока закрыт для игрока

```text
isDiscovered: true
isEntryDisabled: true
```

Квестовый или мировой effect позже выполняет `{ type: 'setPoiEntryDisabled', poiId: 'mayorHouse', disabled: false }` и тем самым удаляет `isEntryDisabled` и разрешает вход.
