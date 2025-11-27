import { ARMOR_TEMPLATES_DB } from '@/data/armor.templates';
import { WEAPON_TEMPLATES_DB } from '@/data/weapon.templates';

export type ItemTemplate = {
  templateId: string;
  type: string;
  dropRate?: number;
  price?: number;
};

export const ITEMS_TEMPLATES_DB: Record<string, ItemTemplate> = {
  money: {
    templateId: 'money',
    type: 'resource',
  },
  scrap: {
    templateId: 'scrap',
    type: 'resource',
  },
  food: {
    templateId: 'food',
    type: 'resource',
  },
  ...WEAPON_TEMPLATES_DB,
  ...ARMOR_TEMPLATES_DB,
} satisfies Record<string, ItemTemplate>;
