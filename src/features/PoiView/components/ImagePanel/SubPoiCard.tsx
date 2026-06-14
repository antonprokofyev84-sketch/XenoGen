import textData from '@/locales/en.json';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { resolvePoiImage } from '@/systems/poi/poiImageResolver';
import { isNonCell } from '@/types/poi.types';
import { assetsVersion } from '@/utils/assetsVersion';

const getPoiDisplayName = (poiType: string | null) => {
  if (!poiType) return 'Unknown POI';

  return textData.poi[poiType as keyof typeof textData.poi]?.name ?? poiType;
};

interface SubPoiCardProps {
  poiId: string;
  disabled?: boolean;
  onSelect: (poiId: string) => void;
}

export const SubPoiCard = ({ poiId, disabled = false, onSelect }: SubPoiCardProps) => {
  const poi = useGameState((state) => poiSelectors.selectPoiById(poiId)(state));

  if (!poi || !isNonCell(poi)) {
    return null;
  }

  const poiType = poi.type;
  const label = getPoiDisplayName(poiType);
  const imageUrl = assetsVersion(resolvePoiImage(poiType, poi.id));

  return (
    <button
      type="button"
      className="subPoiCard"
      onClick={() => {
        if (disabled) return;
        onSelect(poiId);
      }}
      disabled={disabled}
      aria-disabled={disabled}
    >
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
