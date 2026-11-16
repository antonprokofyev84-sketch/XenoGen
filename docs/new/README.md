# Документация XenoGen

Каждое правило имеет один основной документ. Типы в `src/types/` задают точную
структуру данных; документы объясняют семантику и связи. При изменении контракта
обновляется его основной раздел, а ссылки остаются ссылками.

## Контракты

| Документ | Ответственность |
| --- | --- |
| [Клетки](cell-initial-data-design.md) | ID, initial-данные и разведка клеток |
| [POI](poi-initial-data-design.md) | Placements, templates, slots и жизненный цикл узлов |
| [NPC](npc-initial-data-design.md) | Идентичность, расписания, occupancy и знакомство |
| [Frames](frame-initial-data-design.md) | Имена Frames, narrative, фон и `npcDisplay` |
| [Actions](action-initial-data-design.md) | Авторские условия, стоимость, checks, results и transitions |
| [Interaction runtime](interaction-runtime-state-design.md) | Контекст, память, исполнение, текущий текст и история |
| [Interceptors](interceptors-design.md) | Авторские события входа и их очередь |
| [Tension и вход в POI](tension-force-exit-and-poi-entry.md) | Напряжение, force exit и блокировки входа |
| [Квесты](quest-system-design.md) | Стадии, привязки, переменные, журнал и таймеры |
| [Региональные параметры](RegionParameters.md) | Шкалы, локальные уровни POI и изменение региона |
| [Валидация](validation-contract.md) | Проверки initial-данных и точки запуска validator |
| [POI UI](poi-ui-design.md) | Композиция экрана, управление и общие UI-компоненты |
| [Изображения](visual-assets.md) | Подготовка, размеры, хранение и загрузка ассетов |

## Черновики и backlog

- [Бой](combat-system-concept.md) — концепция новой боевой системы.
- [Торговля](TradeSystem.md) — формулы и варианты торгового баланса.
- [Backlog](ideas.md) — открытые вопросы и идеи для следующих задач.

## История проекта

Остальные файлы в `docs/`, включая `docs/old/`, — исторические материалы.
[game.md](../game.md) сохраняет развёрнутый игровой замысел,
[interaction_frame_action_design_v2.md](../interaction_frame_action_design_v2.md) —
мотивацию перехода к Frames/Actions. Текущие правила описаны в таблице выше.
