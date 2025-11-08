import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
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

  const [showAlreadyCaptured, setShowAlreadyCaptured] = useState(false);

  const captiveIdsSet = useMemo(() => new Set(alreadyCaptured.map((c) => c.id)), [alreadyCaptured]);

  const currentCaptivesCount = alreadyCaptured.length;
  const freeSlots = Math.max(0, maxCaptives - currentCaptivesCount);
  const canCaptureMore = freeSlots > 0;

  const uncapturedCandidates = unconsciousEnemies.filter((u) => !captiveIdsSet.has(u.id));
  const canCaptureAll = uncapturedCandidates.length > 0 && uncapturedCandidates.length <= freeSlots;

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

  const handleCaptureAll = () => {
    uncapturedCandidates.forEach((unit) => {
      addCaptive(toCaptive(unit));
    });
  };

  if (combatStatus !== 'victory' || unconsciousEnemies.length === 0) {
    return null;
  }

  const captureAllTitle =
    uncapturedCandidates.length === 0
      ? 'All available enemies already captured'
      : !canCaptureAll
        ? `Not enough free slots (${freeSlots} free, need ${uncapturedCandidates.length})`
        : 'Capture all remaining candidates';

  return (
    <div className="capturedBlock">
      <header className="capturedHeader">
        <h2>
          Captured ({currentCaptivesCount}/{maxCaptives})
        </h2>
        <div className="headerActions">
          <Button
            variant="outline"
            color="green"
            className="smallBtn"
            onClick={handleCaptureAll}
            disabled={!canCaptureAll}
            title={captureAllTitle}
          >
            Capture All
          </Button>
          {frozenAlreadyCaptured.length > 0 && (
            <Button
              variant="ghost"
              className="smallBtn"
              onClick={() => setShowAlreadyCaptured(!showAlreadyCaptured)}
            >
              {showAlreadyCaptured ? 'Hide Old' : `Show Old (${frozenAlreadyCaptured.length})`}
            </Button>
          )}
        </div>
      </header>

      <div className="captiveContent">
        {unconsciousEnemies.length > 0 && (
          <div className="captiveSection">
            <div className="captiveGrid">
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
          </div>
        )}

        {showAlreadyCaptured && frozenAlreadyCaptured.length > 0 && (
          <div className="captiveSection oldCaptives">
            <h3>Already in Party</h3>
            <div className="captiveGrid">
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
          </div>
        )}
      </div>
    </div>
  );
};
