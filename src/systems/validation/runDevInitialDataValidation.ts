import { createInitialDataBundle } from '@/data/initial/bundle';

import { formatValidationIssues, validateInitialData } from './validateInitialData';

/**
 * Запускает валидацию initial-данных при старте dev-сборки.
 *
 * Вызывается только под `import.meta.env.DEV`, поэтому в production-бандл не
 * попадает. Ошибки выводятся списком и не прерывают запуск: автор видит все
 * проблемы сразу, а не по одной.
 */
export function runDevInitialDataValidation(): void {
  const issues = validateInitialData(createInitialDataBundle());

  if (issues.length === 0) {
    return;
  }

  console.error(
    `Initial data validation failed (${issues.length}):\n${formatValidationIssues(issues)}`,
  );
}
