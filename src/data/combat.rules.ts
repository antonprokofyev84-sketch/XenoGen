export const MAX_MEMBERS = 5 as const;
export const SAME_LEVEL_CHANCE = 0.6 as const;
export const LOWER_LEVEL_CHANCE = 0.3 as const;
export const UPPER_LEVEL_CHANCE = 0.1 as const;

// TODO: подумать лад более плавной шкалы бюджета и генерацией на её основе
export const BUDGET_FOR_LEVEL = [0, 2, 4, 8, 14, 21, 27, 33, 39, 44, 50] as const;
