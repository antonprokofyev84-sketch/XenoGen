import type { ReactNode } from 'react';

import { START_DATE } from '@/constants';
import { useGameState } from '@/state/useGameState';
import { t } from '@/systems/text/i18n';
import { resolveLocationPresentation } from '@/systems/world/locationPresentation';
import { diffCalendarDays } from '@/utils/diffCalendarDays';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

import { GameIcon } from './GameIcon';
import { GameTooltip } from './GameTooltip';

import './GameHud.scss';

const PARAMETERS = ['prosperity', 'techLevel', 'contamination', 'threat'] as const;

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
        aria-label={t('gameHud.locationInformation')}
      >
        <header>
          <h2>{location.title}</h2>
          <button
            type="button"
            className="game-button gameLocationToggle"
            aria-label={t(collapsed ? 'gameHud.expand' : 'gameHud.collapse')}
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
          <div className="gameRegionStats" aria-label={t('gameHud.regionParameters')}>
            {PARAMETERS.map((key) => (
              <GameTooltip
                key={key}
                label={`${t(`gameHud.parameters.${key}`)}: ${location.levels?.[key] ?? t('gameHud.unknown')}`}
              >
                <span
                  className="gameRegionStat"
                  tabIndex={0}
                  aria-label={`${t(`gameHud.parameters.${key}`)}: ${location.levels?.[key] ?? t('gameHud.unknown')}`}
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
              {t('gameHud.day', { day: diffCalendarDays(START_DATE, time) + 1 })}
              <span className="gameTimeOfDay">
                {' '}
                · {t(`gameHud.timeOfDay.${resolveTimeOfDay(time)}`)}
              </span>
            </span>
            <span>{clock}</span>
          </div>
          <GameTooltip label={t('gameHud.expeditionUnavailable')}>
            <div className="gameExpedition">
              <span>
                <GameIcon name="cube" />
                <span className="gameExpeditionLabel">{t('gameHud.expeditionPoints')}</span>
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
    <nav className="gameSystemMenu poiMetalPanel" aria-label={t('gameHud.systemMenu')}>
      {(['bag', 'map', 'party', 'settings'] as const).map((icon, index) => {
        const label = [
          t('gameHud.inventory'),
          t('gameHud.map'),
          t('gameHud.party'),
          t('gameHud.settings'),
        ][index];
        return (
          <GameTooltip key={icon} label={index < 2 ? label : t('gameHud.comingLater', { label })}>
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
