import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import type { EnemyTemplate } from '@/types/enemy.types';

const enemiesByFaction: Record<string, EnemyTemplate[]> = {};

for (const enemyTemplate of Object.values(ENEMY_TEMPLATES_DB)) {
  const faction = enemyTemplate.faction;
  (enemiesByFaction[faction] ??= []).push(enemyTemplate);
}

export const enemyRegistry = {
  getById: (id: string): EnemyTemplate | undefined => ENEMY_TEMPLATES_DB[id],
  getByFaction: (faction: string): EnemyTemplate[] => enemiesByFaction[faction] ?? [],
  byId: ENEMY_TEMPLATES_DB,
  all: Object.values(ENEMY_TEMPLATES_DB),
};
