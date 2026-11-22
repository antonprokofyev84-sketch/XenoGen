import { INITIAL_ACTIONS } from '@/data/initial/actions';
import type { StoreState } from '@/state/useGameState';
import { resolveActionAvailability } from '@/systems/interaction/actionAvailability';
import { resolveActionPresentation } from '@/systems/interaction/actionPresentation';
import type { UiAction } from '@/systems/interaction/actionPresentation';
import { t } from '@/systems/text/i18n';
import { resolvePoiDisplayName } from '@/systems/world/locationPresentation';
import type { PoiEntryBlockReason } from '@/systems/world/poiEntry';
import { resolvePoiEntryBlock } from '@/systems/world/poiEntry';
import type { ActionCategory, ActionContext } from '@/types/action.types';
import type { ActionId, PoiId } from '@/types/ids.types';
import { isNpcContext } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { listCurrentActionSources } from './actionSources';
import { resolveCurrentRootFrameId } from './frameIds';

/**
 * Сборка вариантов экрана.
 *
 * Группы сохраняют порядок источников и авторских IDs. Доступность и
 * представление каждого Action разрешаются отдельно; навигация выводится из мира.
 * Результат является производным и не хранится в состоянии.
 */

export interface UiPoiTransition {
  poiId: PoiId;
  label: string;
  /** `parent` — возврат наружу, `child` — вход в дочерний POI. */
  direction: 'parent' | 'child';
  isDisabled: boolean;
  blockReason?: PoiEntryBlockReason;
}

export interface ResolvedInteractionOptions {
  actions: {
    frame: UiAction[];
    poi: UiAction[];
    slot: UiAction[];
    personal: UiAction[];
    quest: UiAction[];
  };
  navigation: {
    /** Выход из slot в текущий POI; есть только в slot/NPC-контексте. */
    canReturnToPoi: boolean;
    poiTransitions: UiPoiTransition[];
  };
}

const emptyOptions = (): ResolvedInteractionOptions => ({
  actions: { frame: [], poi: [], slot: [], personal: [], quest: [] },
  navigation: { canReturnToPoi: false, poiTransitions: [] },
});

/** Собирает видимые Actions одной группы в исходном порядке. */
function buildGroup(
  state: StoreState,
  actionIds: readonly ActionId[] | undefined,
  actionContext: ActionContext,
  categoryOverride?: ActionCategory,
): UiAction[] {
  if (!actionIds || actionIds.length === 0) return [];

  const options: UiAction[] = [];

  for (const actionId of actionIds) {
    const action = INITIAL_ACTIONS[actionId];
    if (!action) continue;

    const availability = resolveActionAvailability(state, actionId, action, actionContext);
    if (!availability) continue;

    options.push(resolveActionPresentation(actionId, action, availability, categoryOverride));
  }

  return options;
}

/** Навигация выводится из состояния мира, а не из авторских Actions. */
function buildNavigation(state: StoreState): ResolvedInteractionOptions['navigation'] {
  // Navigation строится только для существующего interaction текущего экрана.
  const interaction = state.interactionSlice.currentInteraction!;
  const poi = state.poiSlice.pois[interaction.poiId];
  if (!poi || !isNonCellNode(poi)) return emptyOptions().navigation;

  if (isNpcContext(interaction)) {
    return {
      canReturnToPoi: true,
      poiTransitions: [],
    };
  }

  const poiTransitions: UiPoiTransition[] = [
    {
      poiId: poi.parentId,
      label: t('interactionUi.leave'),
      direction: 'parent',
      isDisabled: false,
    },
  ];

  for (const childId of poi.childPoiIds) {
    const child = state.poiSlice.pois[childId];
    // pendingRemoval полностью исключает новый вход, а не показывает disabled.
    if (!child || !isNonCellNode(child) || child.pendingRemoval || !child.details.isDiscovered) {
      continue;
    }

    const blockReason = resolvePoiEntryBlock(state, childId);
    poiTransitions.push({
      poiId: childId,
      label: resolvePoiDisplayName(child.templateId),
      direction: 'child',
      isDisabled: blockReason !== undefined,
      ...(blockReason ? { blockReason } : {}),
    });
  }

  return { canReturnToPoi: false, poiTransitions };
}

export function resolveInteractionOptions(state: StoreState): ResolvedInteractionOptions {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return emptyOptions();

  const poi = state.poiSlice.pois[interaction.poiId];
  if (!poi || !isNonCellNode(poi)) return emptyOptions();

  const actionContext = buildActionContext(state);
  const sources = listCurrentActionSources(state);
  const options = emptyOptions();

  options.actions.frame = buildGroup(state, sources.frame, actionContext);
  options.actions.poi = buildGroup(state, sources.poi, actionContext);
  options.actions.slot = buildGroup(state, sources.slot, actionContext);
  options.actions.personal = buildGroup(state, sources.personal, actionContext);
  options.actions.quest = buildGroup(state, sources.quest, actionContext, 'quest');

  // Навигацию даёт только root: выход из внутреннего Frame — авторский Action.
  if (interaction.activeFrameId === resolveCurrentRootFrameId(state)) {
    options.navigation = buildNavigation(state);
  }

  return options;
}
