# Tension, force exit и вход в POI

Исполнение: [interactionState.ts](../../src/systems/interaction/interactionState.ts),
[dailyMemory.ts](../../src/systems/interaction/dailyMemory.ts),
[poiEntry.ts](../../src/systems/world/poiEntry.ts).

## Дневной tension

Tension принадлежит конкретному NPC. При первом взаимодействии за день берётся
эффективное отношение к игроку и один целый случайный offset `[-20, 20]`:

```text
effectiveRelation = affection × personalWeight + factionReputation × (1 - personalWeight)
tension = clamp(-effectiveRelation + randomOffset, 0, 100)
```

`personalWeight` берётся из loyalty-профиля фракции. Значение сохраняется в дневной
памяти NPC и используется при повторных подходах; следующий день создаёт новый baseline.
`modifyTension` меняет это дневное значение.
Хорошее отношение снижает исходное напряжение. Постоянные последствия конфликта
задаются отдельно состоянием отношений, квеста или POI: дневной tension
сбросится и сам по себе их не сохраняет.

## Force exit

Порог задаёт `FORCE_EXIT_TENSION_THRESHOLD` в dailyMemory. Он проверяется при
инициализации/восстановлении tension и после полного результата Action/Interceptor
с `modifyTension`.

При достижении порога authored-остаток [очереди Interceptors](interceptors-design.md)
заменяется единственным системным item `forceExit`. Планирование идемпотентно.
Item переживает refresh time slot и ждёт root; текущий внутренний Frame продолжается.
При новом подходе к NPC того же дня проверка выполняется снова: пока tension
остаётся на пороге, force exit снова планируется. Смена/утрата актуальности
NPC-контекста очищает прежний системный item.

В root система открывает reserved Frame `templateId/slotId:forceExit`.
Если такого Frame нет, возвращает из NPC-контекста к текущему POI.
Дальнейший исход reserved Frame задают его обычные Actions: например,
блокировка входа и переход `parentPoi`, когда хозяин выставляет игрока за дверь.
Обычный конфликт завершает только разговор: роль NPC сама по себе не блокирует
остальные возможности места.

Например, Action в reserved Frame бармена может выгнать игрока до конца дня:

```ts
result: {
  effects: [{ type: 'disablePoiEntryForDays', poiId: '$currentPoi', days: 1 }],
  transition: { type: 'parentPoi' },
}
```

## Вход в POI

| Состояние                          | Навигация                         |
| ---------------------------------- | --------------------------------- |
| Не обнаружен либо `pendingRemoval` | Переход скрыт                     |
| Закрыт по schedule                 | Disabled, причина `closed`        |
| `isEntryDisabled`                  | Disabled, причина `entryDisabled` |
| `entryDisabledDaysLeft > 0`        | Disabled, причина `entryRefused`  |
| Остальные случаи                   | Доступен                          |

Проверки причин идут в указанном порядке. И UI-навигация, и world travel используют
общее правило `canEnterPoi`. Ограничение относится к новому входу; выход доступен,
уже открытый Frame и дневная симуляция продолжаются.
Блокировка не очищает occupancy, не выгоняет NPC и не распространяется
рекурсивно на дочерние узлы. Сцена фейсконтроля после допустимого входа и
запрет самого входа решают разные задачи.

`isEntryDisabled` хранится как optional `true`. Effect `setPoiEntryDisabled`
с `isDisabled: false` удаляет это поле; с `true` устанавливает его.

`disablePoiEntryForDays` задаёт положительное `entryDisabledDaysLeft`:
1 — до ближайшего конца дня, 2 — остаток текущего и весь следующий день.
Счётчик уменьшается общей дневной фазой и удаляется при нуле.
Оба effects принимают `poiId` конкретного экземпляра либо `$currentPoi`.
