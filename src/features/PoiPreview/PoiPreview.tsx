import textData from '@/locales/en.json';
import { poiSelectors, useGameStore } from '@/state/useGameState';
import { assetsVersion } from '@/utils/assetsVersion';

import { CombatPreview } from './components/CombatPreview/CombatPreview';

import './PoiPreview.scss';

export const PoiPreview = () => {
  const clearSelectedPoiId = useGameStore((state) => state.map.actions.clearSelectedPoiId);
  const poi = useGameStore(poiSelectors.selectSelectedPoi);

  console.log(poi?.type);

  const variation = Math.floor(Math.random() * 3);
  const previewImageUrl = `/images/poi/${poi?.type}/${poi?.poiTemplateId}_${variation}.png`;
  return (
    poi && (
      <div className="poiPreviewOverlay">
        <div className="poiPreview">
          <header className="previewHeader">
            {poi.type === 'combat' ? (
              <CombatPreview />
            ) : (
              <div className="imageContainer">
                <img src={assetsVersion(previewImageUrl)} loading="lazy" />
              </div>
            )}
          </header>

          <div className="previewContent">
            <h2>{poi && textData.poi[poi.poiTemplateId as keyof typeof textData.poi]?.desc}</h2>
            {/* <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus
          tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices
          diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.
        </p> */}
          </div>

          <footer className="previewFooter">
            <button onClick={clearSelectedPoiId} className="backButton">
              {textData.characterCreation.backButton}
            </button>
          </footer>
        </div>
      </div>
    )
  );
};
