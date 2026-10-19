/**
 * Единый источник случайности.
 *
 * Все игровые броски обязаны идти через переданный `Rng`, а не через прямой
 * `Math.random()`. Это делает domain-логику воспроизводимой в тестах и
 * является обязательным условием детерминированных сценариев миграции:
 * `appearanceChance`, `check.chance`, stat/skill rolls, веса `ActionOutcome[]`,
 * `InitialNpcSlot.chance` и выбор candidate, `onDayPass.chance`,
 * случайное отклонение дневного `tension`.
 */

/** Возвращает число в диапазоне `[0, 1)`. */
export type Rng = () => number;

/** Источник случайности по умолчанию, используемый в обычной игре. */
export const defaultRng: Rng = Math.random;

/**
 * Детерминированный PRNG (mulberry32) для тестов и воспроизводимых сценариев.
 *
 * Один и тот же seed всегда даёт одну и ту же последовательность значений.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Бросок вероятности в диапазоне `0..1`.
 *
 * Поскольку `rng()` возвращает `[0, 1)`, граничные значения обрабатываются
 * сами собой: `0` никогда не проходит, `1` проходит всегда. Каждый вызов
 * расходует ровно одно значение источника.
 */
export function rollChance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

/** Целое число в диапазоне `[min, max]`; обе границы включительные. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Случайный элемент массива. Для пустого массива возвращает `undefined`. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return items[Math.floor(rng() * items.length)];
}

export interface WeightedEntry<T> {
  weight: number;
  value: T;
}

/**
 * Выбирает ровно один элемент пропорционально весам.
 *
 * Вес `<= 0` исключает вариант. Если положительных весов нет, возвращает
 * `undefined`; сумма весов обязана быть положительной, и это проверяет
 * development-валидатор.
 */
export function pickWeighted<T>(rng: Rng, entries: readonly WeightedEntry<T>[]): T | undefined {
  const positiveEntries = entries.filter((entry) => entry.weight > 0);

  if (positiveEntries.length === 0) {
    return undefined;
  }

  const totalWeight = positiveEntries.reduce((sum, entry) => sum + entry.weight, 0);

  let threshold = rng() * totalWeight;

  for (const entry of positiveEntries) {
    threshold -= entry.weight;

    if (threshold < 0) {
      return entry.value;
    }
  }

  // Недостижимо при корректных весах; защищает от накопленной погрешности.
  return positiveEntries[positiveEntries.length - 1].value;
}
