# Project Guidelines

## Build And Test

- Install dependencies with `npm install`.
- Start local development with `npm run dev`.
- Create a production build with `npm run build`.
- Format changes with `npm run format` or verify formatting with `npm run format:check`.
- `npm run lint` is available, but this repo has pre-existing ESLint debt. When validating a change, prefer targeted checks on touched files and confirm with editor diagnostics instead of treating a full lint run as a clean gate.

## Architecture

- This is a Vite + React + TypeScript app. The top-level screen switch lives in `src/App.tsx` and routes between feature entry points in `src/features/`.
- Screen changes are state-driven, not route-driven. `src/App.tsx` renders based on `state.ui.currentScreen`, so new screens and transitions should usually be wired through the UI slice rather than a router.
- Global game state is managed in `src/state/useGameState.ts` with Zustand and the `immer` middleware. New state logic should follow the existing slice pattern in `src/state/gameSlices/`.
- Feature screens are composed from feature-local subcomponents. For example, `StrategicMap` is assembled from left/main/bottom panels, and `PoiView` combines dialog, image, and trade modal panels. Keep screen-specific UI inside its feature folder unless it is genuinely reusable.
- Put domain logic in `src/systems/` and shared type definitions in `src/types/`. Keep React components focused on UI and orchestration.
- Static gameplay content and balance data live in `src/data/`, including templates, rules, and initial world content. When adding weapons, POIs, factions, or travel/combat rules, update the corresponding data files instead of hardcoding values in components.

## Conventions

- Use the `@` alias for imports from `src` instead of long relative paths. The alias is configured in `vite.config.ts`.
- Styles use SCSS. Shared variables and mixins come from `src/styles/_variables.scss` and are injected globally through Vite, so component styles can use them without local imports.
- Follow the existing feature-oriented layout: feature screens and UI live under `src/features/`, reusable components under `src/components/`, and state mutations stay inside slice actions or draft helpers.
- Production builds use the Vite base path `/XenoGen/`. Avoid introducing assumptions that the app is always served from `/`, and follow existing Vite/public asset conventions when adding static references.
- Static art assets are organized under `public/images/` by category such as `armor/`, `characters/`, `poi/`, and weapon folders. Existing UI uses root-relative image paths like `/images/...` for public assets.
- SVG support is available through `vite-plugin-svgr`. Prefer the established asset-loading approach already used in the repo before adding a new icon pipeline.
- Interaction-driven overlays should stay store-driven. For example, `PoiView` opens the trade modal from `interactionSlice.isTrading`, so modal visibility and interaction flow should remain in state rather than local component-only flags.
- There are outdated files in the state area, such as `src/state/gameSlices/poi_outdated.ts`. Prefer the active slice files unless a task explicitly targets legacy code.
- There are also legacy or duplicate data files such as `src/data/initialPoi_old.ts` and `src/data/poi.templates copy.ts`. Prefer the active canonical data files unless a task explicitly targets old content.
- Preserve existing naming and structure even where the repo is not fully normalized yet, such as mixed slice property names in `useGameState.ts`, unless the task is specifically a cleanup.
