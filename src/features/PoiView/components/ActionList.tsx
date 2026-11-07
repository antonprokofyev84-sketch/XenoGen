import { GameTooltip } from '@/components/GameHud/GameTooltip';
import type { UiAction } from '@/systems/interaction/resolveOptions';

import { PoiIcon } from './PoiIcon';

export function ActionButton({
  option,
  onSelect,
}: {
  option: UiAction;
  onSelect: (actionId: string) => void;
}) {
  const hints = [...option.disabledReasons, ...option.hints];
  return (
    <GameTooltip
      placement="top"
      label={hints.length > 0 ? hints.map((hint, index) => <p key={index}>{hint}</p>) : undefined}
    >
      <button
        type="button"
        className={`poiAction game-button ${option.category}`}
        aria-disabled={option.isDisabled}
        onClick={(event) => {
          event.stopPropagation();
          // A second pointer click can land here after the first one dismissed narrative.
          // Keyboard activation has detail === 0 and remains available.
          if (event.detail <= 1 && !option.isDisabled) onSelect(option.actionId);
        }}
        data-testid={`action-${option.actionId}`}
      >
        <PoiIcon name={option.category} />
        <span>
          {option.label}
          {option.moneyCost > 0 && <small> ({option.moneyCost} coins)</small>}
        </span>
      </button>
    </GameTooltip>
  );
}
export function ActionList({
  options,
  onSelect,
}: {
  options: readonly UiAction[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="poiActions" aria-label="Available actions">
      {options.map((option) => (
        <ActionButton key={option.actionId} option={option} onSelect={onSelect} />
      ))}
      {options.length === 0 && (
        <p className="poiEmptyActions">No actions available here right now.</p>
      )}
    </div>
  );
}
