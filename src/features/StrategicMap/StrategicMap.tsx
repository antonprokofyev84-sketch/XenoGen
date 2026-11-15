import { useShallow } from 'zustand/react/shallow';

import { GameHud, GameSystemMenu } from '@/components/GameHud/GameHud';
import { GameScene } from '@/components/GameHud/GameScene';
import { GameTooltip } from '@/components/GameHud/GameTooltip';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import text from '@/locales/en.json';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';
import {
  POI_ENTRY_BLOCK_LABELS,
  resolvePoiDisplayName,
} from '@/systems/world/locationPresentation';
import { resolvePoiEntryBlock } from '@/systems/world/poiEntry';

import { MainPanel } from './components/MainPanel/MainPanel';
import { RegionTravelControls } from './components/RegionTravelControls';

import './StrategicMap.scss';

function RegionDestinations({ cellId }: { cellId: string }) {
  const pois = useGameState(useShallow(poiSelectors.selectDiscoveredChildrenOfPoi(cellId)));
  const poiSlice = useGameState((state) => state.poiSlice);
  const world = useGameState((state) => state.world);
  const position = useGameState((state) => state.party.currentPartyPosition);
  return (
    <aside className="poiNavigation poiMetalPanel" aria-label={text.mapUi.pointsOfInterest}>
      <h2>{text.mapUi.pointsOfInterest}</h2>
      <div className="poiRoutes">
        {pois.map((poi) => {
          const name = resolvePoiDisplayName(poi.templateId);
          const reason = resolvePoiEntryBlock({ poiSlice, world }, poi.id);
          const intro = INITIAL_FRAMES[poi.templateId]?.narrative?.find(
            (block) => typeof block === 'string',
          );
          return (
            <GameTooltip
              key={poi.id}
              label={[
                name,
                typeof intro === 'string' ? intro : '',
                reason ? POI_ENTRY_BLOCK_LABELS[reason] : text.worldUi.open,
              ]
                .filter(Boolean)
                .join('\n')}
            >
              <button
                type="button"
                className="game-button"
                disabled={position !== cellId || reason !== undefined}
                onClick={() => world.actions.travelToPoi(poi.id)}
              >
                <span>
                  {name}
                  {reason && <small>{POI_ENTRY_BLOCK_LABELS[reason]}</small>}
                </span>
              </button>
            </GameTooltip>
          );
        })}
        {pois.length === 0 && <p className="mapNoPois">{text.mapUi.emptyPois}</p>}
      </div>
    </aside>
  );
}

export const StrategicMap = () => {
  const position = useGameState((state) => state.party.currentPartyPosition);
  const rootId = useGameState((state) => state.poiSlice.pois[position]?.rootCellId ?? position);
  const focus = useMapInteractionStore((state) => state.focusedPoiId);
  const selectedId = focus ?? rootId;
  const rest = useGameState((state) => state.world.actions.restForMinutes);
  const restUntilMorning = useGameState((state) => state.world.actions.restUntilMorning);
  const insidePoi = useGameState((state) => state.poiSlice.pois[position]?.parentId !== null);
  const goToScreen = useGameState((state) => state.ui.goToScreen);
  return (
    <GameScene>
      <MainPanel readOnly={insidePoi} />
      <GameHud locationId={selectedId}>
        <RegionDestinations cellId={selectedId} />
      </GameHud>
      <section className="mapTravelCommands poiMetalPanel" aria-label={text.mapUi.regionCommands}>
        {insidePoi ? (
          <button type="button" className="game-button" onClick={() => goToScreen('poiView')}>
            {text.mapUi.returnToLocation}
          </button>
        ) : (
          <>
            <RegionTravelControls />
            <button type="button" className="game-button" onClick={() => rest(60)}>
              {text.mapUi.restHour}
            </button>
            <button type="button" className="game-button" onClick={restUntilMorning}>
              {text.mapUi.restMorning}
            </button>
          </>
        )}
      </section>
      <GameSystemMenu />
    </GameScene>
  );
};
