import textData from '@/locales/en.json';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { resolvePoiImage } from '@/systems/poi/poiImageResolver';
import { isNonCell } from '@/types/poi';
import { assetsVersion } from '@/utils/assetsVersion';

const getPoiDisplayName = (poiTemplateId: string | null) => {
  if (!poiTemplateId) return 'Unknown POI';

  return textData.poi[poiTemplateId as keyof typeof textData.poi]?.name ?? poiTemplateId;
};

interface SubPoiCardProps {
  poiId: string;
  onSelect: (poiId: string) => void;
}

export const SubPoiCard = ({ poiId, onSelect }: SubPoiCardProps) => {
  const poi = useGameState((state) => poiSelectors.selectPoiById(poiId)(state));

  if (!poi || !isNonCell(poi)) {
    return null;
  }

  const poiTemplateId = poi.details.poiTemplateId;
  const label = getPoiDisplayName(poiTemplateId);
  const imageUrl = assetsVersion(resolvePoiImage(poiTemplateId, poi.id));

  return (
    <button type="button" className="subPoiCard" onClick={() => onSelect(poiId)}>
      <div className="subPoiPreview">
        <img
          src={imageUrl}
          alt={label}
          onLoad={(e) => {
            e.currentTarget.style.visibility = 'visible';
          }}
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden';
          }}
        />
      </div>
      <span className="subPoiName">{label}</span>
    </button>
  );
};
