import { useShallow } from 'zustand/react/shallow';

import { combatSelectors, useCombatState } from '@/state/useCombatState';
import { generateLoot } from '@/systems/combat/combatLootGenerator';
import type { LootItem } from '@/types/combat.types';
// Предполагаемый импорт
import { assetsVersion } from '@/utils/assetsVersion';

// Предполагаемый импорт

import './LootSection.scss';

// --- Новый внутренний компонент ---
interface LootSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  items: LootItem[];
  imageFolder: string;
  header?: string;
  className?: string;
}

/**
 * Вспомогательный компонент для отрисовки секции лута (оружие, броня и т.д.)
 */
const LootBlock = ({ items, header, imageFolder, className, ...rest }: LootSectionProps) => {
  if (items.length === 0) return null;

  const combinedClassName = `loot-section ${className || ''}`;

  return (
    <div {...rest} className={combinedClassName}>
      {header && <h3>{header}</h3>}
      <div className="loot-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className={`loot-item rarity-${item.rarity || 'common'}`}
            title={`${item.id} (x${item.quantity})`}
          >
            <img
              src={assetsVersion(`${imageFolder}/${item.id}.png`)}
              alt={item.id}
              loading="lazy"
            />
            {item.quantity > 1 && <span className="item-quantity">x{item.quantity}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export const LootSection = () => {
  const allEnemies = useCombatState(useShallow((state) => combatSelectors.selectAllEnemies(state)));
  console.log(JSON.stringify(allEnemies));
  const loot = generateLoot(allEnemies);
  console.log(JSON.stringify(loot));

  // Проверка, есть ли вообще какой-либо лут
  const hasLoot =
    loot.weapons.length > 0 ||
    loot.armors.length > 0 ||
    loot.gadgets.length > 0 ||
    loot.items.length > 0 ||
    loot.money.length > 0 ||
    loot.scrap.length > 0;

  return (
    <div className="lootDisplay">
      {!hasLoot ? (
        <p>No loot found.</p>
      ) : (
        <>
          <LootBlock
            items={loot.weapons}
            header="Weapons"
            imageFolder="/images/weapon/"
            className="weapon-list"
          />
          <LootBlock
            items={loot.armors}
            header="Armor"
            imageFolder="/images/armor/"
            className="armor-list"
          />
          <LootBlock
            items={loot.gadgets}
            header="Gadgets"
            imageFolder="/images/gadget/"
            className="gadget-list"
          />
          <LootBlock
            items={loot.items}
            header="Items"
            imageFolder="/images/items/"
            className="item-list"
          />

          <div className="loot-section resource-list">
            <h3>Resources</h3>

            {loot.money.map((item) => (
              <div key={item.id} className="resource-money">
                MONEY (x{item.quantity})
              </div>
            ))}
            {loot.scrap.map((item) => (
              <div key={item.id} className="resource-scrap">
                SCRAP (x{item.quantity})
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
