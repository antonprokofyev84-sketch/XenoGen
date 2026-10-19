import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import textData from '@/locales/en.json';
import type { StoreState } from '@/state/useGameState';
import { resolveText } from '@/systems/text/resolveText';
import type { PoiEntryBlockReason } from '@/systems/world/poiEntry';
import { resolvePoiEntryBlock } from '@/systems/world/poiEntry';
import type { ActionContext, InitialAction } from '@/types/action.types';
import type { ActionId, NpcId, PoiId, SlotId } from '@/types/ids.types';
import type { CurrentInteraction } from '@/types/interactionRuntime.types';
import { isNpcContext, resolveSubjectKey } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { canAffordCost, resolveActionCost } from './actionCosts';
import { listActionSources, listSlotDefinitions } from './actionSources';
import { evaluateConditions } from './conditions';
import { isExecutionLimitReached } from './dailyMemory';
import { resolveRootFrameId } from './frameIds';

/**
 * Сборка вариантов экрана.
 *
 * Группы возвращаются по источнику, чтобы UI мог показать slots карточками,
 * переходы POI на карте, а квестовые Actions со своей пометкой. Готовый
 * список вариантов не хранится в состоянии: он производный.
 *
 * `conditions` и неудачный дневной `appearanceChance` скрывают вариант;
 * невыполненные `requirements`, нехватка ресурсов и исчерпанный
 * `executionLimit` оставляют его видимым, но disabled.
 */

export interface UiAction {
  actionId: ActionId;
  label: string;
  isDisabled: boolean;
}

export interface UiNpcSlot {
  slotId: SlotId;
  npcId: NpcId;
  role: string;
  name: string;
}

/** Причины недоступности принадлежат правилу входа, а не резолверу вариантов. */
export type { PoiEntryBlockReason as PoiTransitionBlockReason } from '@/systems/world/poiEntry';
export { POI_ENTRY_BLOCK_LABELS as POI_TRANSITION_BLOCK_LABELS } from '@/systems/world/poiEntry';

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
    npcSlots: UiNpcSlot[];
    /** Выход из slot в текущий POI; есть только в slot/NPC-контексте. */
    canReturnToPoi: boolean;
    poiTransitions: UiPoiTransition[];
  };
}

const emptyOptions = (): ResolvedInteractionOptions => ({
  actions: { frame: [], poi: [], slot: [], personal: [], quest: [] },
  navigation: { npcSlots: [], canReturnToPoi: false, poiTransitions: [] },
});

/** Отображаемое имя места; при отсутствии перевода показывается ID шаблона. */
export function resolvePoiDisplayName(templateId: string): string {
  return textData.poi[templateId as keyof typeof textData.poi]?.name ?? templateId;
}

/**
 * Собирает видимые Actions одной группы.
 *
 * Бросок `appearanceChance` здесь не выполняется: его результат уже записан
 * runtime-операцией актуализации, поэтому чистый resolver только читает.
 */
function buildGroup(
  state: StoreState,
  actionIds: readonly ActionId[] | undefined,
  context: ActionContext,
  interaction: CurrentInteraction,
): UiAction[] {
  if (!actionIds || actionIds.length === 0) return [];

  const subjectKey = resolveSubjectKey(interaction);
  const options: UiAction[] = [];

  for (const actionId of actionIds) {
    const action: InitialAction | undefined = INITIAL_ACTIONS[actionId];
    if (!action) continue;

    if (!evaluateConditions(state, action.conditions, context)) continue;

    const appeared =
      state.interactionSlice.dailyMemoryBySubject[subjectKey]?.actions[actionId]?.appeared;
    if (appeared === false) continue;

    const isLimitReached = isExecutionLimitReached(
      state,
      subjectKey,
      'actions',
      actionId,
      action.executionLimit,
    );

    const hasRequirements = evaluateConditions(state, action.requirements, context);
    const canAfford = canAffordCost(state, resolveActionCost(action.cost, context));

    options.push({
      actionId,
      label: resolveText(action.label),
      isDisabled: isLimitReached || !hasRequirements || !canAfford,
    });
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
    return { npcSlots: [], canReturnToPoi: true, poiTransitions: [] };
  }

  const occupants = state.occupancySlice.slotOccupants[interaction.poiId] ?? {};

  const npcSlots: UiNpcSlot[] = listSlotDefinitions(state, interaction.poiId).flatMap((slot) => {
    const npcId = occupants[slot.id];
    if (npcId === undefined) return [];

    return [{ slotId: slot.id, npcId, role: slot.role, name: INITIAL_NPCS[npcId]?.name ?? npcId }];
  });

  const poiTransitions: UiPoiTransition[] = [
    {
      poiId: poi.parentId,
      label: 'Уйти',
      direction: 'parent' as const,
      isDisabled: false,
    },
    ...poi.childPoiIds.flatMap((childId) => {
      const child = state.poiSlice.pois[childId];

      // pendingRemoval полностью исключает новый вход, а не показывается disabled.
      if (!child || !isNonCellNode(child) || child.pendingRemoval) return [];
      if (!child.details.isDiscovered) return [];

      const blockReason = resolvePoiEntryBlock(state, childId);

      return [
        {
          poiId: childId,
          label: resolvePoiDisplayName(child.templateId),
          direction: 'child' as const,
          isDisabled: blockReason !== undefined,
          ...(blockReason ? { blockReason } : {}),
        },
      ];
    }),
  ];

  return { npcSlots, canReturnToPoi: false, poiTransitions };
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
  options.actions.quest = buildGroup(state, sources.quest, context, interaction);

  // Навигацию даёт только root: выход из внутреннего Frame — авторский Action.
  if (interaction.activeFrameId === resolveRootFrameId(state, interaction)) {
    options.navigation = buildNavigation(state, interaction);
  }

  return options;
}
