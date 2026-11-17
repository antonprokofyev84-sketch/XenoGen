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
import type { CurrentInteraction } from '@/types/interactionRuntime.types';
import { isNpcContext, resolveSubjectKey } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { listActionSources } from './actionSources';
import { resolveRootFrameId } from './frameIds';

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
  context: ActionContext,
  interaction: CurrentInteraction,
  categoryOverride?: ActionCategory,
): UiAction[] {
  if (!actionIds || actionIds.length === 0) return [];

  const subjectKey = resolveSubjectKey(interaction);
  const options: UiAction[] = [];

  for (const actionId of actionIds) {
    const action = INITIAL_ACTIONS[actionId];
    if (!action) continue;

    const availability = resolveActionAvailability(state, actionId, action, context, subjectKey);
    if (!availability) continue;

    options.push(resolveActionPresentation(actionId, action, availability, categoryOverride));
  }

  return options;
}

/** Навигация выводится из состояния мира, а не из авторских Actions. */
function buildNavigation(
  state: StoreState,
  interaction: CurrentInteraction,
): ResolvedInteractionOptions['navigation'] {
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

  const context = buildActionContext(state, interaction, interaction.activeFrameId);
  const sources = listActionSources(state, interaction);
  const options = emptyOptions();

  options.actions.frame = buildGroup(state, sources.frame, context, interaction);
  options.actions.poi = buildGroup(state, sources.poi, context, interaction);
  options.actions.slot = buildGroup(state, sources.slot, context, interaction);
  options.actions.personal = buildGroup(state, sources.personal, context, interaction);
  options.actions.quest = buildGroup(state, sources.quest, context, interaction, 'quest');

  // Навигацию даёт только root: выход из внутреннего Frame — авторский Action.
  if (interaction.activeFrameId === resolveRootFrameId(state, interaction)) {
    options.navigation = buildNavigation(state, interaction);
  }

  return options;
}
