import { useMemo } from 'react';

// --- ИМПОРТ ИКОНОК РЕСУРСОВ КАК КОМПОНЕНТОВ ---
import FoodIcon from '@/assets/icons/food.svg?react';
import MoneyIcon from '@/assets/icons/money.svg?react';
import ScrapIcon from '@/assets/icons/scrap.svg?react';
import { useCombatState } from '@/state/useCombatState';
import type { InventoryItem } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './LootSection.scss';

// Тип для ресурсов (требует React-компонент иконки, отличается от InventoryItem наличием Icon)
interface ResourceItemDisplay {
  templateId: string;
  quantity: number;
  rarity: string;
  Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

/**
 * Блок для обычных предметов (PNG из папок)
 * Теперь принимает массив InventoryItem
 */
const LootBlock = ({ items, className }: { items: InventoryItem[]; className?: string }) => {
  if (items.length === 0) return null;

  return (
    <div className={`lootSection ${className || ''}`}>
      <div className="lootGrid">
        {items.map((item, index) => (
          <div
            key={`${item.templateId}-${index}`}
            className={`lootItem ${item.rarity || 'common'}`}
            title={`${item.templateId} (x${item.quantity})`}
          >
            <div className="iconContainer">
              <img
                // Динамический путь: /images/{type}/{id}.png
                src={assetsVersion(`/images/${item.type}/${item.templateId}.png`)}
                alt={item.templateId}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {item.quantity > 1 && <span className="itemQuantity">x{item.quantity}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Отдельный блок для ресурсов (SVG компоненты)
 */
const ResourceBlock = ({
  items,
  className,
}: {
  items: ResourceItemDisplay[];
  className?: string;
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`lootSection ${className || ''}`}>
      <div className="lootGrid">
        {items.map((item, index) => (
          <div
            key={`res-${item.templateId}-${index}`}
            className={`lootItem resourceItem ${item.rarity || 'common'}`}
            title={`${item.templateId}: ${item.quantity}`}
          >
            <div className="iconContainer">
              <item.Icon className="svgIcon" />
            </div>
            <span className="itemQuantity">x{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LootSection = () => {
  const loot = useCombatState((state) => state.loot);

  const { mainLoot, resourcesLoot } = useMemo(() => {
    if (!loot) return { mainLoot: [], resourcesLoot: [] };

    const res: ResourceItemDisplay[] = [];

    if (loot.resources.money > 0) {
      res.push({
        templateId: 'Money',
        quantity: loot.resources.money,
        rarity: 'unique',
        Icon: MoneyIcon,
      });
    }

    if (loot.resources.scrap > 0) {
      res.push({
        templateId: 'Scrap',
        quantity: loot.resources.scrap,
        rarity: 'common',
        Icon: ScrapIcon,
      });
    }

    if (loot.resources.food > 0) {
      res.push({
        templateId: 'Ration',
        quantity: loot.resources.food,
        rarity: 'common',
        Icon: FoodIcon,
      });
    }

    return { mainLoot: loot.items, resourcesLoot: res };
  }, [loot]);

  if (!loot) return null;

  const hasLoot = mainLoot.length > 0 || resourcesLoot.length > 0;

  return (
    <div className="lootDisplay">
      {!hasLoot ? (
        <div className="emptyLoot">No loot found.</div>
      ) : (
        <>
          <LootBlock items={mainLoot} className="mainLootList" />

          {resourcesLoot.length > 0 && (
            <div className="resourcesDivider">
              <ResourceBlock items={resourcesLoot} className="resourcesList" />
            </div>
          )}
        </>
      )}
    </div>
  );
};
