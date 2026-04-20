import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import { isNonCell } from '@/types/poi/nodes';

import { DialogOptions } from '../DialogOptions/DialogOptions';
import { InteractionLogItem } from '../InteractionLogItem/InteractionLogItem';

import './DialogPanel.scss';

export const DialogPanel = () => {
  const currentInteraction = useGameState(interactionSelectors.selectCurrentInteraction);
  const interactionLog = currentInteraction?.interactionLog ?? [];

  const poiId = currentInteraction?.poiId ?? null;
  const poi = useGameState((state) => (poiId ? poiSelectors.selectPoiById(poiId)(state) : null));
  const poiTemplateId = poi && isNonCell(poi) ? poi.details.poiTemplateId : null;

  return (
    <div className="dialogPanel">
      {/* Заголовок в стиле StatsPanel */}
      <div className="panelHeader">
        <h3>{poiTemplateId ?? 'Unknown'}</h3>
      </div>

      <div className="dialogContainer">
        {/* Scrollable Text Area */}
        <div className="scrollableContent">
          {interactionLog.length > 0 && (
            <div className="dialogLogSection">
              <div className="interactionLogList">
                {interactionLog.map((logItem, index) => (
                  <InteractionLogItem key={`${logItem.action}-${index}`} log={logItem} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interaction Options (Fixed at bottom or separate block) */}
        <DialogOptions />
      </div>
    </div>
  );
};
