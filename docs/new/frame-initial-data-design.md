# Frames и narrative

Формат: [frame.types.ts](../../src/types/frame.types.ts),
[narrativeBlock.types.ts](../../src/types/narrativeBlock.types.ts).
Реестр: `src/data/initial/frames.ts`.
`FrameId` — ключ общего плоского registry. Definitions можно группировать
в файлах по месту, квесту или encounter, затем объединять в `INITIAL_FRAMES`.

## Идентификаторы

| Назначение              | Frame ID                      |
| ----------------------- | ----------------------------- |
| POI root                | `templateId`                  |
| Slot root               | `templateId/slotId`           |
| Внутренний Frame        | `contextId:framePath`         |
| Пример квестового Frame | `bob:missingCourier:question` |

`/` отделяет slot, `:` — путь Frame. Root совпадает с ID контекста.
Эти разделители не используются внутри `templateId`, `slotId` и отдельного
сегмента `framePath`. Slot root относится к template и роли, поэтому его имя
сохраняется при смене occupant.
Frame ID адресует definition; конкретные `poiId`, `slotId`, `npcId` и цели effects
задаются runtime-контекстом. Открытие `bob:question` само по себе не выбирает Боба собеседником.
Ограничение текущего validator на имена NPC-Frames описано в
[фактическом покрытии валидации](validation-contract.md#фактическое-покрытие-и-runtime).
Имена `closed` и `forceExit` зарезервированы для системных Frames;
[force exit](tension-force-exit-and-poi-entry.md#force-exit) использует slot-контекст.
Формы IDs — `templateId:closed` и `templateId/slotId:forceExit`.
Проверку закрытого входа задаёт [доступность POI](tension-force-exit-and-poi-entry.md#вход-в-poi),
а будущий closed-flow остаётся в [backlog](ideas.md#poi-и-локализация-контента).

## Поля Frame

Frame — пассивное описание ситуации. Он задаёт optional `title`, `background`,
`npcDisplay`, `narrative` и ссылки `actionIds`. Правила выбора принадлежат
[Actions](action-initial-data-design.md) и [Interceptors](interceptors-design.md).
[Композиция root Actions](interaction-runtime-state-design.md#контекст-и-варианты-действий)
выполняется runtime.

`background` — URL статически импортированного изображения. Frame с заданным
фоном заменяет текущий; без поля сохраняет его. Переключение POI ↔ slot/NPC
сохраняет фон, travel в другой POI и завершение interaction сбрасывают его.
Если первый Frame нового POI без background, сцена может остаться без изображения.
Внутренний Frame с другим background меняет текущий фон: возврат к root применит
фон root только при наличии у него собственного `background`.

Например, сцена разговора (оба Action IDs определяются отдельно):

```ts
'redBoar/keeper:question': {
  title: 'The missing courier',
  npcDisplay: 'always',
  narrative: [
    '{$npc} puts the glass down.',
    { speakerId: '$npc', text: 'What do you want to know?' },
  ],
  actionIds: ['courier:persuade', 'courier:changeSubject'],
}
```

Сцена наследует фон таверны. Checks, расходы и дальнейшие переходы описываются
в двух Actions; условия запуска сцены принадлежат входному Action или Interceptor.

## Narrative

Порция состоит из блоков трёх видов:

```ts
['The door opens.', { speakerId: '$npc', text: 'Come in.' }, { thought: 'I should be careful.' }];
```

Описания, реплики и мысли используют inline `LocalizedText`, который разрешает
`resolveText()`. `speakerId` — ID персонажа либо `$npc` текущего разговора.
`{$npc}` внутри текста заменяется отображаемым именем или ролью текущего NPC.
Оба placeholder требуют NPC-контекст. Снимок текста создаёт runtime при поступлении
в [текущую порцию](interaction-runtime-state-design.md#текст-и-история).

## Показ NPC

| `npcDisplay`        | Поведение                                                         |
| ------------------- | ----------------------------------------------------------------- |
| `none`              | Скрыть фигуру                                                     |
| `speaker` (default) | Показать последнего NPC-speaker текущей порции на время чтения    |
| `always`            | Показывать контекстного NPC; другой speaker временно заменяет его |

На сцене одновременно одна фигура. `always` требует NPC-контекст.
Расположение фигуры задаёт [POI UI](poi-ui-design.md), подготовку файла —
[стандарт изображений](visual-assets.md).
