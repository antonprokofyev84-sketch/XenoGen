import type { ReactNode } from 'react';

import { START_DATE } from '@/constants';
import { useGameState } from '@/state/useGameState';
import { resolveLocationPresentation } from '@/systems/world/locationPresentation';
import { diffCalendarDays } from '@/utils/diffCalendarDays';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

import { GameIcon } from './GameIcon';
import { GameTooltip } from './GameTooltip';

import './GameHud.scss';

const TIME_LABELS = {
  late_night: 'Late night',
  early_morning: 'Early morning',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};
const PARAMETERS = [
  ['prosperity', 'Prosperity'],
  ['techLevel', 'Technology'],
  ['contamination', 'Contamination'],
  ['threat', 'Threat'],
] as const;

export function GameHud({ locationId, children }: { locationId: string; children?: ReactNode }) {
  const poiSlice = useGameState((state) => state.poiSlice);
  const world = useGameState((state) => state.world);
  const collapsed = useGameState((state) => state.ui.isLocationHudCollapsed);
  const toggleLocationHud = useGameState((state) => state.ui.toggleLocationHud);
  const location = resolveLocationPresentation({ poiSlice, world }, locationId);
  const time = world.currentTime;
  const clock = new Date(time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="gameHudStack">
      <aside
        className={`gameLocation poiMetalPanel${collapsed ? ' isCollapsed' : ''}`}
        aria-label="Current location and region information"
      >
        <header>
          <h2>{location.title}</h2>
          <button
            type="button"
            className="game-button gameLocationToggle"
            aria-label={collapsed ? 'Expand location details' : 'Collapse location details'}
            aria-expanded={!collapsed}
            aria-controls="game-location-details"
            onClick={toggleLocationHud}
          >
            <GameIcon name={collapsed ? 'chevronDown' : 'chevronUp'} />
          </button>
        </header>
        <div id="game-location-details" hidden={collapsed}>
          {location.parentTitle && <p className="gameLocationParent">{location.parentTitle}</p>}
          <p className="gameLocationStatus">{location.status}</p>
          <div className="gameRegionStats" aria-label="Region parameters">
            {PARAMETERS.map(([key, label]) => (
              <GameTooltip key={key} label={`${label}: ${location.levels?.[key] ?? 'Unknown'}`}>
                <span
                  className="gameRegionStat"
                  tabIndex={0}
                  aria-label={`${label}: ${location.levels?.[key] ?? 'Unknown'}`}
                >
                  <GameIcon name={key} />
                  <span>{location.levels?.[key] ?? '—'}</span>
                </span>
              </GameTooltip>
            ))}
          </div>
        </div>
        <div className="gameLocationSummary">
          <div className="gameTime">
            <span>
              Day {diffCalendarDays(START_DATE, time) + 1}
              <span className="gameTimeOfDay"> · {TIME_LABELS[resolveTimeOfDay(time)]}</span>
            </span>
            <span>{clock}</span>
          </div>
          <GameTooltip label="Expedition points are not implemented yet">
            <div className="gameExpedition">
              <span>
                <GameIcon name="cube" />
                <span className="gameExpeditionLabel">Expedition points</span>
              </span>
              <span>—</span>
            </div>
          </GameTooltip>
        </div>
      </aside>
      {children}
    </div>
  );
}

export function GameSystemMenu() {
  const openInventory = useGameState((state) => state.ui.openCharacterDetails);
  const goToScreen = useGameState((state) => state.ui.goToScreen);
  const screen = useGameState((state) => state.ui.currentScreen);
  return (
    <nav className="gameSystemMenu poiMetalPanel" aria-label="System menu">
      {(['bag', 'map', 'party', 'settings'] as const).map((icon, index) => {
        const label = ['Inventory', 'Map', 'Party', 'Settings'][index];
        return (
          <GameTooltip key={icon} label={index < 2 ? label : `${label} · coming later`}>
            <button
              type="button"
              className="game-button"
              aria-label={label}
              disabled={index > 1 || (index === 1 && screen === 'strategicMap')}
              onClick={index === 0 ? openInventory : () => goToScreen('strategicMap')}
            >
              <GameIcon name={icon} />
            </button>
          </GameTooltip>
        );
      })}
    </nav>
  );
}
