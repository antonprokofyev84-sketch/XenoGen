import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import { resolvePoiImage } from '@/systems/poi/poiImageResolver';
import { isNonCell } from '@/types/poi';
import { assetsVersion } from '@/utils/assetsVersion';

import { SubPoiCard } from './SubPoiCard';

import './ImagePanel.scss';

const getPoiDisplayName = (poiTemplateId: string | null) => {
  if (!poiTemplateId) return 'Unknown POI';

  return textData.poi[poiTemplateId as keyof typeof textData.poi]?.name ?? poiTemplateId;
};

export const ImagePanel = () => {
  const currentInteraction = useGameState(interactionSelectors.selectCurrentInteraction);
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);

  const poiId = currentInteraction?.poiId ?? null;
  const npcId = currentInteraction?.npcId ?? null;

  const poi = useGameState((state) => (poiId ? poiSelectors.selectPoiById(poiId)(state) : null));
  const discoveredChildren = useGameState(
    useShallow((state) => (poiId ? poiSelectors.selectDiscoveredChildrenOfPoi(poiId)(state) : [])),
  );

  const poiTemplateId = poi && isNonCell(poi) ? poi.details.poiTemplateId : null;
  const poiName = getPoiDisplayName(poiTemplateId);
  const poiImageUrl = assetsVersion(resolvePoiImage(poiTemplateId ?? 'unknown', poiId, npcId));

  const handleSubPoiClick = (targetPoiId: string) => {
    travelToPoi(targetPoiId);
  };

  return (
    <div className="imagePanel">
      <div className="imageContainer">
        <div className="poiImage">
          <img
            key={poiImageUrl}
            src={poiImageUrl}
            alt={poiName}
            onLoad={(e) => {
              e.currentTarget.style.visibility = 'visible';
            }}
            //TODO potentially we don't need  onError handler as we already getting only existing images from resolver.
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
          <div className="vignette" />
        </div>

        {discoveredChildren.length > 0 && (
          <div className="subPoiStrip">
            {discoveredChildren.map((childPoi) => (
              <SubPoiCard key={childPoi.id} poiId={childPoi.id} onSelect={handleSubPoiClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
