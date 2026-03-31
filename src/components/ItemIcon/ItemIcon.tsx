import type { Rarity } from '@/types/common.types';
import type { ItemType } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './ItemIcon.scss';

interface ItemIconProps {
  templateId: string;
  type: ItemType;
  rarity: Rarity;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
}

export const ItemIcon = ({
  templateId,
  type,
  rarity,
  quantity,
  className,
  children,
}: ItemIconProps) => (
  <div className={`itemIcon ${rarity} ${className ?? ''}`}>
    <img
      src={assetsVersion(`/images/${type}/${templateId}.png`)}
      alt=""
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
    {(quantity ?? 0) > 1 && <span className="itemIconQuantity">x{quantity}</span>}
    {children}
  </div>
);
