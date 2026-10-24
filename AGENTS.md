# XenoGen — инструкции по работе с проектом

## Назначение игры

XenoGen — браузерная RPG в мире кибер-постапокалипсиса. Подача вдохновлена
Master of Raana: статичные изображения мест и ситуаций, текст, диалоги и выбор действий.
Мир исследуется через карту клеток и расположенные в них POI; важны персонажи,
отряд, ресурсы, квесты и развитие собственной базы.

Историческая концепция мира: после Падения Пыль изменила биосферу и разрушила
устойчивость цивилизации; высокие технологии сохранились неравномерно. Герой
сбегает из рабского каравана и получает доступ к заброшенной лаборатории.
Это направление сеттинга, а не подтверждение готовности сюжета или всех механик.

## Источники истины и чтение документации

- Актуальные дизайн-документы находятся в `docs/new/`. Начинай с относящихся
  к задаче документов, затем сверяй их с действующими типами и реализацией.
- `docs/new/migration-decisions.md` содержит принятые решения и уточнения
  миграции; используй их при разночтениях с более ранними проектными формами.
- Документы вне `docs/new/` устарели в той или иной степени. Они полезны для
  истории и общего замысла, но не задают современные контракты данных.
- `docs/interaction_frame_action_design_v2.md` объясняет мотивацию перехода
  от services к Frames/Actions. Его примеры полей, routes, порядка исполнения
  и памяти не следует переносить в современный runtime.
- `docs/game.md` описывает игровой замысел; детали механик и приоритетов в нём
  исторические. `README.md` пока содержит шаблон Vite, а не спецификацию игры.
- Даже в `docs/new/` различай принятый контракт, рабочую концепцию и backlog.
  Наличие идеи в документе не означает, что она реализована или утверждена в деталях.
- Код показывает фактическое поведение, документация — целевой дизайн. При
  расхождении явно укажи его; не откатывай реализацию и не объявляй дизайн
  реализованным без проверки. Решения для новой задачи принимай в её границах.

Карта актуальных документов:

| Область | Документы в `docs/new/` |
| --- | --- |
| Решения, границы и этапы миграции | `migration-decisions.md`, `migration-plan.md` |
| Контракты initial-данных | `cell-initial-data-design.md`, `poi-initial-data-design.md`, `npc-initial-data-design.md` |
| Frames и Actions | `frame-initial-data-design.md`, `action-initial-data-design.md` |
| Interaction state, исполнение и открытые вопросы | `interaction-runtime-state-design.md`, `interaction-runtime-engine-questions.md`, `interaction-runtime-open-questions.md` |
| Автоматические события | `interceptors-design.md` |
| Напряжение, force exit и вход в POI | `tension-force-exit-and-poi-entry.md` |
| Статические квесты | `quest-system-design.md` |
| Региональные параметры | `RegionParameters.md` |
| Валидация контента | `validation-contract.md` |
| Будущие механики и баланс | `combat-system-concept.md`, `TradeSystem.md`, `ideas.md` |

## Стек и расположение кода

- Vite, React 19, TypeScript со strict-проверками, Zustand 5 + Immer, SCSS.
  Зависимости фиксирует `package-lock.json`; менеджер пакетов — npm.
- `src/App.tsx` выбирает экран через `state.ui.currentScreen`. Переходы между
  экранами управляются store; учитывай эту модель при добавлении новых экранов.
- `src/features/` — экраны и их локальные компоненты; `src/components/` — общие
  UI-компоненты. Игровые правила размещай в `src/systems/`.
- `src/state/useGameState.ts` собирает slices из `src/state/gameSlices/`.
  `src/state/useCombatState.ts` и `src/state/useMapInteractionStore.ts` — отдельные stores.
  Сохраняй существующие имена полей slices при локальных изменениях.
- `src/types/` — плоский каталог общих доменных типов. `src/data/` — templates,
  правила и баланс; `src/data/initial/` — канонические initial-реестры, включая
  `poiTemplates.ts`. `bundle.ts` собирает набор для валидации.
- `src/data/initial/fixtures/` — технический контент для проверки контрактов.
  Сейчас основные initial-реестры подключают эти fixtures; это не готовый
  сюжет, production-контент или утверждённый баланс.
- `src/systems/world/newGameBootstrap.ts` собирает мир новой игры после создания
  персонажа; не дублируй инициализацию в UI.

## Архитектурные правила

- Разделяй immutable definitions, изменяемое runtime-состояние и производные
  данные для UI. Счётчики, броски и текущих occupants не записывай в initial-реестры.
- Изменяй игровой state через slice actions и существующие draft helpers.
  Связанные изменения мира, времени и interaction выполняй одной Immer-транзакцией;
  внутри draft helper не вызывай вложенные `set` других slices.
- React отображает готовые варианты и отправляет команды. Не размещай в render
  игровую случайность, списание ресурсов, продвижение квестов или effects.
  Производные Zustand-селекторы, возвращающие объекты/массивы, должны сохранять
  стабильные ссылки при неизменном state; следуй текущей мемоизации selectors.
- Новые игровые броски проводи через `Rng` из `src/systems/rolls/rng.ts`.
  Используй `createSeededRng` для воспроизводимых сценариев.
- Функции `ActionNumber` чистые: получают `ActionContext`, возвращают число,
  не бросают случайность и не читают произвольные Zustand slices.
- Новые абстракции, effects и ограничения вводи под конкретный игровой сценарий.
  Не расширяй автоматически задачу до реализации всего backlog или повторной миграции.

## Модель мира, POI и NPC

- Cell — корневой узел с `parentId === null`; обычный POI имеет родителя.
  Используй topology guards из `src/types/worldNode.types.ts`, а не `poi.type`.
  Не возвращай `isLocalSpot`, `localSpotIds`, services и старые narrative maps.
- ID клетки — `{col}-{row}` с неотрицательными координатами; работай через
  helpers `src/systems/world/cellId.ts`. Координаты выводятся из ID.
- `INITIAL_POIS_BY_CELL` хранит placements, `POI_TEMPLATES` — механические
  definitions. `templateId` не является типом POI; runtime хранит instance ID,
  `parentId`, `rootCellId` и непосредственные `childPoiIds`.
- Slots принадлежат template POI и не являются отдельными POI. Роль принадлежит
  slot, а NPC — фактический occupant. Постоянные назначения хранятся отдельно
  от `candidateNpcIds`; недоступный назначенный NPC оставляет slot пустым.
- NPC имеют полный `baseSchedule` для шести частей суток: `work`, `freeTime`,
  `home`, `hidden`. Resolved schedule глобален, actual occupancy создаётся лениво
  для посещённого POI и кешируется на time slot. Повторный вход не перебрасывает
  occupants; один NPC не занимает два slots и не получает вторую работу.
- Все клетки карты видны; `isDiscovered` относится к POI. Актуальность разведки
  клетки задаёт `explorationDaysLeft`, постоянство POI — `lifetimeDaysLeft`.
  `null` означает бессрочность; `Infinity` не используется.
- Региональные параметры: `prosperity`, `techLevel`, `contamination`, `threat`.
  Raw клетки — `0..999`, включая дробные; уровни — целые `0..9`.
  Используй `resolvePoiRegionLevels` из `src/systems/world/regionLevels.ts`:
  `floor(raw / 100)`, затем override либо modifier, затем clamp. Вложенный POI
  берёт основу из root cell, не наследует локальные modifiers родителя.
- Обычную навигацию строй из дерева мира; особые сюжетные переходы оформляй
  Actions. Перемещение проводи через world/travel pipeline с едиными затратами
  и проверками входа. Блокировка нового входа не запрещает выход.

## Frames, Actions и Interceptors

- Frame пассивен: background, `npcDisplay`, narrative, `actionIds`. Conditions,
  costs, checks, effects и transitions принадлежат исполняемому контенту.
- Root Frame POI — `templateId`, slot root — `templateId/slotId`; внутренние
  Frames используют `contextId:framePath`. `closed` и `forceExit` зарезервированы.
  Контекст хранит конкретный `poiId` и либо оба `slotId + npcId`, либо ни одного.
  Не выводи текущие POI/NPC или цели effects из строки Frame ID.
- POI root объединяет frame/poi/quest Actions; slot root — frame/slot/personal/quest.
  Внутренний Frame показывает только собственные Actions. Slots и переходы
  между POI — отдельная runtime-навигация, не authored Actions.
- `conditions` скрывают Action; `requirements`, недостаточный `cost` и лимиты
  оставляют его disabled. Массивы условий работают как AND.
  Action содержит ровно одно из `result`/`check`; обе ветки check обязательны.
- Порядок попытки: один раз разрешить cost, авансом списать деньги/предметы/личную
  stamina и засчитать попытку; выполнить check/выбрать outcome; применить effects
  и narrative; выполнить transition; применить отложенное время через мировую
  операцию; обработать её последствия и актуализировать видимые варианты.
  Провал check также расходует cost и лимит. `cost.time` — минуты, без двойной оплаты.
  Полный resolver условий/групп повторно при нажатии не запускается.
- Память Actions/Interceptors адресуется по `subject + executableId`, где subject —
  конкретный `poiId` или `npcId`, без slot/frame. Daily memory и total-счётчики
  переживают выход; конец дня очищает только daily memory. `appearanceChance`
  бросается один раз за день после выполнения conditions, вне UI selectors.
- Interceptor — автоматическое событие входа, без кнопки, cost и requirements.
  Одна `pendingEvents`-очередь принадлежит текущему контексту. Больший priority
  исполняется раньше; conditions проверяются повторно при извлечении события.
  Silent result продолжает очередь; Frame приостанавливает её до root.
- `forceExit` — системный item этой очереди только для slot/NPC. Он заменяет
  authored-остаток, переживает refresh time slot, ждёт root и не прерывает внутренний
  Frame. Без reserved Frame возвращает к текущему POI. Tension — дневная память
  NPC; baseline `clamp(-effectiveRelation + randomOffset, 0, 100)`, offset `[-20, 20]`.
- В том же контексте log сохраняется; смена POI ↔ slot/NPC начинает новый log,
  сохраняя background. Travel в другой POI и завершение interaction сбрасывают фон.
  Log хранит разрешённые narrative blocks, без снимков background/layout/visuals.
- Текст нового контента хранится inline через `LocalizedText` и `resolveText()`.
  Используй существующие narrative helpers для `$npc` и `{$npc}`.

## Квесты и конец дня

- Статические квесты создаются сразу, начиная с `initialStage`/`status: 'initial'`.
  Продвижение идёт через effects обычных Actions/Interceptors, без отдельного
  `startQuest`, event bus или универсальных tasks/objectives.
- Квестовые привязки адресуют конкретный `npcId` или `poiId`, не template/slot.
  Производные индексы Actions/Interceptors обновляются при смене стадии/статуса.
  В одном effects-блоке допускается максимум один lifecycle-effect на квест.
- На каждую пересечённую границу дня соблюдай общий порядок: POI day effects
  и world counters → таймеры стадий, затем активных квестов и собранные effects →
  removal sweep → очистка daily interaction memory. После всех дней обновляются
  schedules, occupancy и interaction для конечного time slot.
- `pendingRemoval` сразу рекурсивно помечает POI и потомков; физическое удаление
  с очисткой зависимостей происходит общим sweep. Помеченный POI не допускает
  новых входов и не выполняет `onDayPass`, но позволяет завершить выход.

## Границы дизайна и известные расхождения

- Save/load и совместимость старых сохранений не входят в текущий контракт.
- Новая боевая концепция ещё не означает реализацию: Action `combat` сейчас
  выводит предупреждение. Торговля использует существующую модалку; формулы
  и коэффициенты из `TradeSystem.md` — идеи, требующие отдельной задачи.
- `ideas.md`, включая `expeditionPoints`, — backlog. В коде уже есть
  `modifyPartyStamina`, хотя каталог effects в migration docs его не перечисляет.
  Различай личную `cost.stamina` и текущую партийную механику; перед изменением
  сверяй `src/types/gameEffect.types.ts` и соответствующие helpers.
- Порог force exit в дизайне оставлен балансным вопросом, но текущая константа
  находится в `src/systems/interaction/dailyMemory.ts`. Не дублируй её в контенте.
- Возврат к root пока может повторять narrative: в `performAction.ts` есть TODO,
  хотя дизайн предполагает отсутствие повтора. Учитывай это при задачах на presentation.
- `.github/copilot-instructions.md` содержит полезные общие соглашения, но также
  устаревшие пути и примеры удалённых legacy-файлов; проверяй их по дереву проекта.

## Команды, проверка и рабочие соглашения

| Задача | Команда |
| --- | --- |
| Установка по lockfile | `npm ci` |
| Локальный запуск | `npm run dev` |
| TypeScript + production build | `npm run build` |
| Просмотр build | `npm run preview` |
| Vitest | `npm test` / `npm run test:watch` |
| ESLint | `npm run lint` |
| Проверка форматирования | `npm run format:check` |

- CI использует Node 20, `npm ci` и `npm run build`; push в `main` запускает
  deployment на GitHub Pages. Production base — `/XenoGen/`; учитывай его для assets.
- Для нового Frame background предпочитай статический import. Baseline NPC art:
  `src/assets/npcs/<npcId>/default.webp` (resolver также поддерживает PNG).
  Существующие public assets находятся в `public/images/`.
- Используй `@/` для импортов из `src`, type-only imports и существующий SCSS-подход.
  Переменные SCSS инжектируются Vite. Форматирование: 2 пробела, single quotes,
  semicolons, trailing commas, print width 100 и сортировка imports из `.prettierrc`.
  Форматируй затронутые файлы, не весь репозиторий ради локальной правки.
- Для изменений кода основной gate — `npm run build`. Vitest настроен на
  `src/**/*.test.ts` в Node и допускает отсутствие тестов; успешный пустой запуск
  не доказывает покрытие. Migration docs откладывают тесты отдельной задачей,
  а не запрещают добавлять их при подходящей задаче.
- В `.github/copilot-instructions.md` отмечен существующий ESLint-долг: проверяй
  затронутые TS/TSX-файлы и отделяй новые ошибки от исходных, не объявляй весь lint чистым.
- Контент сверяй с `validation-contract.md` и `validateInitialData` /
  `assertValidInitialData` в `src/systems/validation/validateInitialData.ts`.
  Dev entry point запускает validator, но только пишет ошибки в консоль;
  production build сам по себе не подтверждает валидность initial-данных.
  Ошибки авторских данных исправляй явно, без runtime-дедупликации и тихого ремонта.
- Для изменений runtime проверяй подходящие вертикальные сценарии на fixtures:
  вход/выход, success/fail, лимиты, смена time slot/дня, force exit, удаление POI,
  квестовые переходы и открытие торговли. Для правки только документации достаточно
  проверки ссылок/путей и `git diff --check`; сборка приложения не обязательна.
- В начале задачи проверь Git status и сохрани чужие изменения. В отчёте укажи
  результат, выполненные проверки и оставшиеся расхождения. Коммиты, push и
  публикацию выполняй в рамках явного запроса пользователя.
- Существенные новые решения фиксируй в соответствующих документах `docs/new/`,
  а устойчивые изменения архитектуры и рабочего процесса — в этом файле.
  Не полагайся на память чата и не превращай `AGENTS.md` в журнал каждой задачи.
