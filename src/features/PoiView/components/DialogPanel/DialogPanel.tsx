import { interactionSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import type { NarrativeBlock } from '@/types/narrativeBlock.types';
import { isDialogueLine, isThoughtLine } from '@/types/narrativeBlock.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { DialogOptions } from '../DialogOptions/DialogOptions';

import './DialogPanel.scss';

const renderBlock = (block: NarrativeBlock, key: string) => {
  if (isDialogueLine(block)) {
    return (
      <p className="narrativeBlock narrativeBlock--dialogue" key={key}>
        {block.text}
      </p>
    );
  }

  if (isThoughtLine(block)) {
    return (
      <p className="narrativeBlock narrativeBlock--thought" key={key}>
        {block.thought}
      </p>
    );
  }

  return (
    <p className="narrativeBlock" key={key}>
      {block}
    </p>
  );
};

/**
 * Лог взаимодействия.
 *
 * В логе лежат уже разрешённые narrative-блоки, поэтому последующие изменения
 * occupancy, знакомства или роли старый текст не меняют.
 */
export const DialogPanel = () => {
  const log = useGameState(interactionSelectors.selectInteractionLog);
  const poiId = useGameState(
    (state) => interactionSelectors.selectCurrentInteraction(state)?.poiId ?? null,
  );

  const poi = useGameState((state) => (poiId ? poiSelectors.selectPoiById(poiId)(state) : null));
  const poiType = poi && isNonCellNode(poi) ? poi.templateId : null;

  return (
    <div className="dialogPanel">
      <h3 className="dialogTitle">{poiType ?? 'Unknown'}</h3>

      <div className="dialogContainer">
        <div className="scrollableContent">
          <div className="interactionLogList">
            {log.map((entry, entryIndex) =>
              entry.blocks.map((block, blockIndex) =>
                renderBlock(block, `${entryIndex}-${blockIndex}`),
              ),
            )}
          </div>
        </div>

        <DialogOptions />
      </div>
    </div>
  );
};
