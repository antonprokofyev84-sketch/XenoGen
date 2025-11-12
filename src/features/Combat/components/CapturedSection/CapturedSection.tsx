import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { combatSelectors, useCombatState } from '@/state/useCombatState';
import { partySelectors, useGameState } from '@/state/useGameState';
import type { CombatUnit } from '@/types/combat.types';
import type { Captive } from '@/types/party.types';

import { PrisonerCard } from '../PrisonerCard/PrisonerCard';

import './CapturedSection.scss';

// Хелпер для конвертации боевого юнита в пленника
const toCaptive = (unit: CombatUnit): Captive => ({
  id: unit.id, // <--- ИСПРАВЛЕНО
  templateId: unit.templateId,
  level: unit.level,
  faction: unit.faction,
  appearanceVariation: unit.appearanceVariation,
  rarity: unit.rarity,
});

export const CapturedSection = () => {
  const combatStatus = useCombatState((state) => state.combatResult.combatStatus);
  const unconsciousEnemies = useCombatState(useShallow(combatSelectors.selectUnconsciousEnemies));

  const alreadyCaptured = useGameState(useShallow((state) => state.party.captives));
  const maxCaptives = useGameState(partySelectors.selectMaxCaptives);
  const addCaptive = useGameState((state) => state.party.actions.addCaptive);
  const removeCaptive = useGameState((state) => state.party.actions.removeCaptive);

  const [frozenAlreadyCaptured] = useState<Captive[]>(structuredClone(alreadyCaptured));

  const captiveIdsSet = useMemo(() => new Set(alreadyCaptured.map((c) => c.id)), [alreadyCaptured]);

  const currentCaptivesCount = alreadyCaptured.length;
  const freeSlots = Math.max(0, maxCaptives - currentCaptivesCount);
  const canCaptureMore = freeSlots > 0;

  const handleToggle = (unit: CombatUnit | Captive) => {
    const id = unit.id;
    const isCaptured = captiveIdsSet.has(id);

    if (isCaptured) {
      removeCaptive(id);
    } else {
      if (canCaptureMore) {
        // Если это полный CombatUnit, конвертируем его. Если уже Captive - оставляем.
        // Проверяем наличие лишних полей, чтобы понять, кто есть кто (или просто используем toCaptive если это CombatUnit)
        const captiveData = 'stats' in unit ? toCaptive(unit as CombatUnit) : (unit as Captive);
        addCaptive(captiveData);
      }
    }
  };

  if (combatStatus !== 'victory' || unconsciousEnemies.length === 0) {
    return null;
  }

  return (
    <div className="capturedSection">
      <header className="capturedHeader">
        Some enemies can be captured. Already captured ({currentCaptivesCount}/{maxCaptives})
      </header>

      <div className="capturedContent">
        <div className="capturedList">
          {unconsciousEnemies.map((unit) => (
            <PrisonerCard
              key={unit.id}
              unit={unit}
              isCaptured={captiveIdsSet.has(unit.id)}
              isLimitReached={!canCaptureMore}
              onToggle={() => handleToggle(unit)}
            />
          ))}
        </div>

        {frozenAlreadyCaptured.length > 0 && (
          <div className="capturedList alreadyCaptured">
            {frozenAlreadyCaptured.map((captive) => (
              <PrisonerCard
                key={captive.id}
                unit={captive}
                isCaptured={captiveIdsSet.has(captive.id)}
                isLimitReached={!canCaptureMore}
                onToggle={() => handleToggle(captive)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
