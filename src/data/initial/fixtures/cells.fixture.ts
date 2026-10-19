import type { InitialCellList } from '@/types/cellContent.types';

/**
 * Технические фикстуры клеток.
 *
 * Нейтральный контент для проверки контрактов миграции. Не задаёт игровой
 * нарратив и баланс; все ID имеют префикс `fixture`, кроме самих клеток,
 * чьи ID обязаны соответствовать формату `{col}-{row}`.
 *
 * `0-0` — спокойный регион, `1-0` — опасный и заражённый: пара даёт разные
 * итоговые уровни для проверки условий `regionLevel`.
 */
export const FIXTURE_CELLS: InitialCellList = [
  {
    id: '0-0',
    details: {
      terrain: 'plain',
      regionParameters: {
        // Уровни: prosperity 3, techLevel 2, contamination 0, threat 1.
        prosperity: 350,
        techLevel: 240,
        contamination: 80,
        threat: 150,
      },
    },
  },
  {
    id: '1-0',
    details: {
      terrain: 'ruins',
      regionParameters: {
        // Уровни: prosperity 0, techLevel 0, contamination 5, threat 6.
        prosperity: 90,
        techLevel: 50,
        contamination: 520,
        threat: 640,
      },
      explorationDaysLeft: 3,
    },
  },
];
