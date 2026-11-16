# XenoGen

Браузерная RPG в мире кибер-постапокалипсиса: карта регионов и POI,
статичные иллюстрации, диалоги, отряд, ресурсы и квесты.

## Запуск

Node.js 22.12+; CI использует Node 22.

```sh
npm ci
npm run dev
```

## Команды

| Команда                           | Назначение                    |
| --------------------------------- | ----------------------------- |
| `npm run build`                   | TypeScript и production build |
| `npm run preview`                 | Просмотр production build     |
| `npm test` / `npm run test:watch` | Vitest                        |
| `npm run lint`                    | ESLint                        |
| `npm run format:check`            | Проверка форматирования       |

Push в `main` запускает deployment на GitHub Pages; base path — `/XenoGen/`.

[Правила работы с кодом](AGENTS.md) · [Документация](docs/new/README.md)
