# Initial Cell Data Design

## Статус

В документе зафиксирована структура initial-данных и runtime-данных клеток карты.

В этом документе рассматриваются только клетки. Обычные POI описаны отдельно в `poi-initial-data-design.md`: их initial-данные находятся в `pois.ts`, группируются по корневой клетке и используют `templateId` вместо `type`.

---

## 1. Файлы initial-данных

```text
src/data/initial/
  cells.ts
  pois.ts
```

Экспорты:

```ts
export const INITIAL_CELLS = [...];
export const INITIAL_POIS_BY_CELL = {...};
```

- `INITIAL_CELLS` содержит авторские initial-данные клеток.
- `INITIAL_POIS_BY_CELL` содержит initial-данные обычных POI, сгруппированные по `rootCellId`.
- Шаблоны POI хранятся отдельно, например в `poiTemplates.ts`. Их структура в этот документ не входит.

---

## 2. Что не хранится в initial-клетке

Initial-клетка не хранит значения, которые однозначно выводятся системой:

```ts
type
parentId
rootCellId
col
row
childPoiIds
```

Причины:

- Клетка уже находится в `INITIAL_CELLS`, поэтому `type: 'cell'` ничего не добавляет.
- У клетки всегда `parentId: null`.
- У клетки всегда `rootCellId === id`.
- `col` и `row` вычисляются из `id`.
- Список непосредственных дочерних POI строится инициализатором.

Поле `isLocalSpot` и `localSpotIds` удаляются полностью. Локальные spots больше не являются POI: вместо них будут slots внутри обычного POI.

---

## 3. Формат Cell ID

ID клетки является единственным источником её координат:

```text
{col}-{row}
```

Примеры:

```text
0-0
3-1
9-9
```

Нужны две централизованные функции:

```ts
export function createCellId(col: number, row: number): string {
  return `${col}-${row}`;
}

export function parseCellId(cellId: string): {
  col: number;
  row: number;
} {
  const match = /^(\d+)-(\d+)$/.exec(cellId);

  if (!match) {
    throw new Error(`Invalid cell id: ${cellId}`);
  }

  return {
    col: Number(match[1]),
    row: Number(match[2]),
  };
}
```

Формат предполагает неотрицательные координаты. Если когда-либо понадобятся отрицательные координаты, соглашение об ID нужно будет изменить.

Инициализатор не вводит отдельный слой проверок для авторских данных. Некорректный формат ID и так приводит к ошибке в `parseCellId`; уникальность, границы фиксированной сетки и полнота набора клеток проверяются при разработке и тестировании данных, а не при каждом запуске игровой логики.

---

## 4. Initial-тип клетки

```ts
export type RemainingDays = number | null;

export interface InitialCell {
  id: string;

  details: {
    terrain: CellTerrain;
    regionParameters: RegionParameters;

    visitedTimes?: number;
    lastTimeVisited?: number | null;
    explorationLevel?: number;
    explorationDaysLeft?: RemainingDays;
  };
}
```

Пример `cells.ts`:

```ts
import type { InitialCell } from '@/types/poi.types';

export const INITIAL_CELLS = [
  {
    id: '2-0',

    details: {
      terrain: 'mountain',

      regionParameters: {
        threat: 105,
        contamination: 5,
        prosperity: 20,
        techLevel: 0,
      },
    },
  },

  {
    id: '3-1',

    details: {
      terrain: 'plain',

      regionParameters: {
        threat: 105,
        contamination: 5,
        prosperity: 20,
        techLevel: 0,
      },

    },
  },
] satisfies InitialCell[];
```

`regionParameters` пока остаётся обязательным полным объектом. Дефолты или частичные overrides стоит вводить только в том случае, если в реальных данных появится значительное повторение.

Значения региональных параметров являются числами в диапазоне `0..999` и могут быть дробными. Производный уровень вычисляется отдельно через `Math.floor(raw / 100)` и всегда находится в целом диапазоне `0..9`.

---

## 5. Посещение и исследование клетки

У клетки нет `isDiscovered`: клетки фиксированной карты всегда видны. Поле `isDiscovered` остаётся только у обычных POI и означает, видит ли игрок конкретный POI в принципе.

Для клетки сохраняется механика временной актуальности разведки:

```ts
explorationDaysLeft: RemainingDays;
```

Семантика:

```text
null → разведданные не устаревают
0    → актуальных разведданных нет
1..N → разведданные актуальны ещё N дней
```

При `0` состояние определяется вместе с историей посещений:

```text
explorationDaysLeft === 0 && visitedTimes === 0 → не исследована
explorationDaysLeft === 0 && visitedTimes > 0   → исследована, но данные устарели
```

`null` имеет ту же общую семантику, что и у `lifetimeDaysLeft` POI: состояние постоянно и не уменьшается. Состояние «клетка когда-то дистанционно разведывалась, но разведка истекла и партия там не была» намеренно не отличается от неисследованной клетки.

`explorationDaysLeft` подключён к общей world-owned фазе счётчиков `onDayEnd`, той же, которая обрабатывает POI lifetime, временную блокировку входа и последующие счётчики оставшихся дней. Отдельного cell-specific дневного pipeline нет. Собственное zero-state rule разведки:

```text
null → не изменяется
0    → остаётся 0
N>0  → уменьшается на 1
```

Смысл остальных полей:

- `visitedTimes` — число календарных дней, в которые партия завершала посещение клетки; счётчик увеличивается при выходе не чаще одного раза за день.
- `lastTimeVisited` — время последнего выхода партии из клетки; обновляется при выходе и используется для защиты от повторного увеличения `visitedTimes` в тот же день.
- `explorationLevel` — степень исследования клетки и прогресс обнаружения находящихся в ней POI.

Инварианты посещения:

```text
visitedTimes === 0 → lastTimeVisited === null
visitedTimes > 0   → lastTimeVisited содержит время последнего выхода
```

В обычных initial-данных все клетки стартуют непосещёнными, поэтому `visitedTimes` и `lastTimeVisited` не указываются и получают `0` и `null`. Для тестовых или специальных стартовых данных с `visitedTimes > 0` и отсутствующим `lastTimeVisited` допустим fallback «за год до стартовой даты»; обычный старт его не использует.

Точная механика, связывающая `explorationLevel` клетки с `explorationThreshold` POI и открытием POI, находится вне области этого документа. Здесь фиксируются только initial/runtime-поля клетки.

---

## 6. Runtime-тип клетки

После инициализации клетка должна быть полностью нормализована: runtime-код не должен постоянно обрабатывать отсутствующие значения.

```ts
export interface CellDetails {
  col: number;
  row: number;
  terrain: CellTerrain;
  regionParameters: RegionParameters;

  visitedTimes: number;
  lastTimeVisited: number | null;
  explorationLevel: number;
  explorationDaysLeft: RemainingDays;
}

export interface CellNode {
  id: string;
  parentId: null;
  rootCellId: string;
  childPoiIds: string[];
  details: CellDetails;
}
```

`rootCellId` и координаты остаются в runtime как удобные вычисленные данные:

```ts
cell.rootCellId === cell.id;
cell.details.col;
cell.details.row;
```

Хотя `rootCellId` клетки дублирует `id`, его добавляет система, а не автор. Это сохраняет единый runtime-интерфейс для операций, которым нужен `rootCellId` любого узла.

`childPoiIds` содержит только непосредственных детей клетки. Вложенные потомки через несколько уровней в этот массив не добавляются.

---

## 7. Runtime-дефолты

Initial-тип разрешает не указывать изменяемое состояние. Инициализатор заполняет его обязательными runtime-дефолтами:

```ts
export const DEFAULT_CELL_STATE: Pick<
  CellDetails,
  | 'visitedTimes'
  | 'lastTimeVisited'
  | 'explorationLevel'
  | 'explorationDaysLeft'
> = {
  visitedTimes: 0,
  lastTimeVisited: null,
  explorationLevel: 0,
  explorationDaysLeft: 0,
};
```

Таким образом, в runtime не требуется писать:

```ts
cell.details.visitedTimes ?? 0;
```

Достаточно:

```ts
cell.details.visitedTimes;
```

---

## 8. Инициализация клетки

Инициализатор является единственным местом, где initial-объект превращается в полный runtime-объект:

```ts
export function createInitialCell(initialCell: InitialCell): CellNode {
  const { col, row } = parseCellId(initialCell.id);

  return {
    id: initialCell.id,
    parentId: null,
    rootCellId: initialCell.id,
    childPoiIds: [],

    details: {
      ...DEFAULT_CELL_STATE,
      ...initialCell.details,
      col,
      row,
    },
  };
}
```

Порядок сборки важен:

1. Сначала устанавливаются runtime-дефолты.
2. Затем применяются явно заданные initial-значения.
3. `col` и `row` записываются последними и всегда вычисляются из `id`.

При общей инициализации мира сначала создаются клетки, затем обрабатывается `INITIAL_POIS_BY_CELL`. Инициализатор POI добавит каждому POI `rootCellId`, взятый из ключа группы, и заполнит соответствующие `childPoiIds`.

---

## 9. Определение клетки в runtime

Отдельный дискриминатор `type: 'cell'` не нужен. Клетка однозначно определяется отсутствием родителя:

```ts
export type PoiNode = CellNode | NonCellPoiNode;

export function isCell(node: PoiNode): node is CellNode {
  return node.parentId === null;
}

export function isNonCell(node: PoiNode): node is NonCellPoiNode {
  return node.parentId !== null;
}
```

Для надёжного сужения union должны соблюдаться два инварианта:

```ts
interface CellNode {
  parentId: null;
}

interface NonCellPoiNode {
  parentId: string;
}
```

У `NonCellPoiNode.parentId` не должно быть типа `string | null` или optional. Проект должен использовать `strictNullChecks`.

Принятое топологическое правило:

```text
parentId === null → Cell
parentId !== null → обычный POI
```

Оно остаётся корректным, пока клетки являются единственными корневыми узлами мира.

---

## 10. Краткий итог

Initial-клетка хранит только авторские данные:

```text
id
terrain
regionParameters
необязательное начальное состояние
```

Инициализатор добавляет:

```text
parentId: null
rootCellId: id
col и row из id
childPoiIds: []
runtime-дефолты
```

Из модели удаляются:

```text
type: 'cell'
isLocalSpot
localSpotIds
```

В runtime клетка определяется через:

```ts
node.parentId === null;
```

Структура обычных POI, slots, `INITIAL_POIS_BY_CELL` и применение POI templates зафиксированы в отдельном документе `Initial POI Data Design`.
