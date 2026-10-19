export type Rarity = 'common' | 'uncommon' | 'rare' | 'unique';

/**
 * От низшей редкости к высшей.
 *
 * Списание расходует дешёвые стопки первыми: отдавать уникальный
 * предмет, пока есть обычный, игрок точно не хочет.
 */
export const RARITY_ORDER: readonly Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

/**
 * Пользовательский текст авторского контента: `label`, narrative и записи журнала.
 *
 * В v1 это обычная строка, и контент хранит финальный текст инлайн — квест
 * читается целиком в одном месте. Весь такой текст обязан проходить через
 * единый `resolveText()`, поэтому позже тип можно расширить до
 * `string | Partial<Record<LocaleCode, string>>` без переписывания контента.
 */
export type LocalizedText = string;

/**
 * Оставшиеся дни мирового счётчика.
 *
 * ```text
 * null → состояние постоянно и не уменьшается
 * 0    → срок закончился
 * N>0  → осталось N дней
 * ```
 *
 * `null` используется вместо `Infinity`, чтобы значение корректно
 * сериализовалось через JSON.
 */
export type RemainingDays = number | null;

/** Числовое сравнение условий. Границы включительные; `exact` означает равенство. */
export interface NumericComparison {
  min?: number;
  max?: number;
  exact?: number;
}
