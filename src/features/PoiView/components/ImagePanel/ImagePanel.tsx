import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import { resolvePoiImage } from '@/systems/poi/poiImageResolver';
import { isNonCell } from '@/types/poi';
import { assetsVersion } from '@/utils/assetsVersion';

import './ImagePanel.scss';

export const ImagePanel = () => {
  const currentInteraction = useGameState(interactionSelectors.selectCurrentInteraction);

  const poiId = currentInteraction?.poiId ?? null;
  const npcId = currentInteraction?.npcId ?? null;

  console.log('ImagePanel render', { poiId, npcId });

  const poi = useGameState((state) => (poiId ? poiSelectors.selectPoiById(poiId)(state) : null));

  const poiTemplateId = poi && isNonCell(poi) ? poi.details.poiTemplateId : null;

  const poiImageUrl = assetsVersion(resolvePoiImage(poiTemplateId, poiId, npcId));
  console.log(poiImageUrl);

  return (
    <div className="imagePanel">
      <div className="imageContainer">
        <div className="poiImage">
          <img
            src={poiImageUrl}
            alt="Point of Interest"
            onError={(e) => {
              (e.target as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
          <div className="vignette" />
        </div>
      </div>
    </div>
  );
};
