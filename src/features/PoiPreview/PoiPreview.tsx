import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
import textData from '@/locales/en.json';
import { poiSelectors, useGameStore } from '@/state/useGameState';
import { assetsVersion } from '@/utils/assetsVersion';

import { CombatPreview } from './components/CombatPreview/CombatPreview';

import './PoiPreview.scss';

export const PoiPreview = () => {
  const clearSelectedPoiId = useGameStore((state) => state.map.actions.clearSelectedPoiId);
  const goToScreen = useGameStore((state) => state.ui.goToScreen);
  const poi = useGameStore(useShallow(poiSelectors.selectSelectedPoi));

  //Todo add variation into poi generation
  const variation = Math.floor(Math.random() * 3);
  const previewImageUrl = `/images/poi/${poi?.type}/${poi?.poiTemplateId}_${variation}.png`;

  return (
    poi && (
      <div className="poiPreviewOverlay">
        <div className="poiPreview">
          <header className="previewHeader">
            {poi.type === 'combat' || poi.type === 'boss' ? (
              <CombatPreview />
            ) : (
              <div className="imageContainer">
                <img src={assetsVersion(previewImageUrl)} loading="lazy" />
              </div>
            )}
          </header>

          <div className="previewContent">
            <h2>{textData.poi[poi.poiTemplateId as keyof typeof textData.poi]?.desc}</h2>
          </div>

          <footer className="previewFooter">
            <Button onClick={() => clearSelectedPoiId()} variant="solid" color="white">
              {textData.characterCreation.backButton}
            </Button>

            {(poi.type === 'combat' || poi.type === 'boss') && (
              <Button onClick={() => goToScreen('combat')} variant="solid" color="red">
                {textData.poiDetails.attackButton || 'Attack'}
              </Button>
            )}
          </footer>
        </div>
      </div>
    )
  );
};
