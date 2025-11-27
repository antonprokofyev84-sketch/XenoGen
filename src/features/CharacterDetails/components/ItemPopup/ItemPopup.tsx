import { forwardRef, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import MoneyIcon from '@/assets/icons/money.svg?react';
import textData from '@/locales/en.json';
import { characterSelectors } from '@/state/gameSlices/characters';
import { useGameState } from '@/state/useGameState';
import { buildItemDetails } from '@/systems/items/itemDetailsBuilder';

import './ItemPopup.scss';

interface ItemPopupProps {
  activeCharacterId: string;
  style?: React.CSSProperties;
}

const getRarityLabel = (rarity: string) => {
  // @ts-ignore
  const rarityDict = textData.rarity as Record<string, string> | undefined;
  return rarityDict?.[rarity] || rarity;
};

export const ItemPopup = forwardRef<HTMLDivElement, ItemPopupProps>(
  ({ activeCharacterId, style }, ref) => {
    const selectedItemEntry = useGameState((state) => state.inventory.selectedItem);

    // Получаем полные статы персонажа для проверки требований
    const charMainStats = useGameState(
      useShallow(characterSelectors.selectEffectiveMainStats(activeCharacterId)),
    );
    const charSecondaryStats = useGameState(
      useShallow(characterSelectors.selectEffectiveSecondaryStats(activeCharacterId)),
    );
    const charSkills = useGameState(
      useShallow(characterSelectors.selectEffectiveSkills(activeCharacterId)),
    );

    const fullCharStats = useMemo(
      () => ({
        mainStats: charMainStats,
        secondaryStats: charSecondaryStats,
        skills: charSkills,
      }),
      [charMainStats, charSecondaryStats, charSkills],
    );

    if (!selectedItemEntry || !selectedItemEntry.item) return null;

    const { item } = selectedItemEntry;
    const rarity = item.rarity || 'common';

    const itemLocale = (textData.items as Record<string, { name: string }>)[item.templateId];
    const name = itemLocale?.name || item.templateId;
    const rarityLabel = getRarityLabel(rarity);

    // --- СБОРКА ДАННЫХ ---
    const details = useMemo(() => {
      return buildItemDetails(item, fullCharStats);
    }, [item, fullCharStats]);

    if (!details) return null;

    const renderActions = () => {
      // Если это не инвентарь (а например слот экипировки), то кнопка "Снять"
      if (selectedItemEntry.context !== 'inventory') {
        return (
          <button className="popupBtn unequip" onClick={() => console.log('Unequip')}>
            Unequip
          </button>
        );
      }

      switch (item.type) {
        case 'meleeWeapon':
        case 'rangeWeapon':
          return (
            <>
              <button className="popupBtn" onClick={() => console.log('Equip Main')}>
                To Main
              </button>
              <button className="popupBtn" onClick={() => console.log('Equip Secondary')}>
                To Secondary
              </button>
            </>
          );
        case 'armor':
        case 'gadget':
          return (
            <button className="popupBtn" onClick={() => console.log('Equip')}>
              Equip
            </button>
          );
        case 'consumable':
          return (
            <button className="popupBtn use" onClick={() => console.log('Use')}>
              Use
            </button>
          );
        default:
          return null;
      }
    };

    return (
      <div ref={ref} style={style} className={`itemPopup ${rarity}`}>
        {/* HEADER */}
        <div className={`popupHeader ${rarity}`}>
          <div className="titleRow">
            <span className="itemName">{name}</span>
            <span className="rarityLabel">{rarityLabel}</span>
          </div>
          {details.price > 0 && (
            <div className="priceRow">
              <span className="priceValue">{details.price}</span> <MoneyIcon className="icon" />
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="popupBody">
          {/* 1. REQUIREMENTS */}
          {details.requirementRows.length > 0 && (
            <div className="section requirements">
              <div className="sectionTitle">Requires</div>
              <div className="reqGrid">
                {details.requirementRows.map((req, idx) => (
                  <span key={idx} className={`reqItem ${req.isMet ? 'met' : 'unmet'}`}>
                    {req.label} {req.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 2. BASE STATS */}
          {details.baseRows.length > 0 && (
            <div className="section baseStats">
              {details.baseRows.map((row, idx) => (
                <div key={idx} className="statRow">
                  <span className="label">{row.label}</span>
                  <span className="value highlight">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 3. MODS */}
          {details.modRows.length > 0 && (
            <div className="section mods">
              <div className="sectionTitle"></div>
              {details.modRows.map((row, idx) => (
                <div key={idx} className="statRow">
                  <span className="label">{row.label}</span>
                  {/* Используем highlight для цвета (good/bad) */}
                  <span className={`value ${row.highlight || ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 4. DESCRIPTION */}
          {details.description && <div className="section description">{details.description}</div>}
        </div>
        {/* FOOTER ACTIONS */}
        <div className="popupFooter">{renderActions()}</div>
      </div>
    );
  },
);
