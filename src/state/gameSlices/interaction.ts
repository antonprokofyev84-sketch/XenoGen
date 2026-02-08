import { SERVICE_RULES, getServiceNamesById, getServicesState } from '@/data/poi.services';
import { EffectManager } from '@/systems/effects/effectManager';
import {
  computeInitialTension,
  resolveEffectiveRelation,
  resolveInteractionEffects,
} from '@/systems/interaction/interactionRules';
import { type StatRollResult, rollStatCheck } from '@/systems/rolls/statRollService';
import type { ResolvedTriggerRules } from '@/types/effects.types';
import type {
  ForceBehavior,
  InteractionLogEvent,
  InteractionService,
  InteractionServiceRule,
  InteractionServiceState,
} from '@/types/interaction.types';
import type { NonCellNode } from '@/types/poi.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

const FORCE_EXIT_TENSION_THRESHOLD = 80;

export interface CurrentInteraction {
  poiId: string; // poiId
  poiType?: NonCellNode['type'];
  npcId?: string;
  factionId?: string;
  /** Отношение на момент входа (рассчитывается из репутации) */
  effectiveRelation: number;
  /** Напряжение на момент входа */
  initialTension: number;
  /** Текущее напряжение */
  tension: number;
  interactionLog?: InteractionLogEvent[];
  services: InteractionServiceState[];
}

export interface InteractionSlice {
  currentInteraction: CurrentInteraction | null;

  /**
   * Накопленное напряжение до конца дня.
   * Ключ — id POI или NPC.
   */
  tensionById: Record<string, number>;
  // TODO: нужно созранять все взаимодействие а не только tension

  actions: {
    startInteraction: (params: {
      poiId: string;
      effectiveRelation?: number;
      initialTension?: number;
    }) => void;
    performService: (serviceId: InteractionService) => void;
    updateTension: (delta: number) => void;
    endInteraction: () => void;
    clearAllTension: () => void;
  };
}

// Draft helpers

const applyForceTensionReactionDraft = (state: StoreState) => {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;
  if (interaction.tension > FORCE_EXIT_TENSION_THRESHOLD) {
    applyForceExitServicesDraft(state);
  }
};

const startInteractionDraft = (
  state: StoreState,
  params: {
    poiId: string;
    effectiveRelation?: number;
    initialTension?: number;
  },
) => {
  const { poiId, effectiveRelation: providedRelation, initialTension: providedTension } = params;
  const poi = state.poiSlice.pois[poiId] as NonCellNode | undefined;
  const npcId = poi?.details?.ownerId;
  const poiType = poi?.type;

  let effectiveRelation = providedRelation;
  let initialTension = providedTension;
  let factionId: string | undefined = undefined;

  if (npcId) {
    // TODO: Получить отношение npc
    // пока зафиксируем нейтральное
    factionId = 'neutral'; // заглушка
  } else {
    factionId = poi?.details?.faction;
  }

  if (effectiveRelation === undefined) {
    const factionReputation = factionId ? (state.factions.reputationById[factionId] ?? 0) : 0;

    // TODO: получить личную симпатию от персонажей к владельцу POI или фракции
    const personalAffection = 0;

    if (factionId) {
      effectiveRelation = resolveEffectiveRelation({
        factionId,
        factionReputation,
        personalAffection,
      });
    } else {
      // если нет фракции — нейтральное взаимодействие
      effectiveRelation = 0;
    }
  }

  if (initialTension === undefined) {
    const storedTension = state.interactionSlice.tensionById[npcId ?? poiId];
    initialTension = storedTension ?? computeInitialTension(effectiveRelation);
  }

  const baseServices = getServiceNamesById(poi?.type as string);
  if (npcId) {
    baseServices.push('talk');
  }

  const services: InteractionServiceState[] = getServicesState(baseServices);
  const interactionLog: InteractionLogEvent[] = [
    {
      action: 'enter',
      success: true,
      tension: initialTension,
    },
  ];

  state.interactionSlice.currentInteraction = {
    poiId,
    poiType,
    npcId,
    factionId,
    effectiveRelation,
    initialTension,
    tension: initialTension,
    interactionLog,
    services,
  };

  applyForceTensionReactionDraft(state);
};

const applyForceExitServicesDraft = (state: StoreState) => {
  const currentServices = state.interactionSlice.currentInteraction?.services;
  const isAttackServiceAvailable = currentServices?.some((service) => service.id === 'attack');
  let newServices: InteractionService[] = [];
  let forceAction: ForceBehavior;
  if (!isAttackServiceAvailable) {
    forceAction = 'forceLeave';
    newServices = getServiceNamesById(forceAction);
  } else {
    if (Math.random() < 0.5) {
      forceAction = 'forceAttack';
      newServices = getServiceNamesById(forceAction);
    } else {
      forceAction = 'forceRetreat';
      newServices = getServiceNamesById(forceAction);
    }
  }

  const services: InteractionServiceState[] = getServicesState(newServices);
  if (state.interactionSlice.currentInteraction) {
    const currentInteraction = state.interactionSlice.currentInteraction;
    currentInteraction.services = services;

    if (!currentInteraction.interactionLog) {
      currentInteraction.interactionLog = [];
    }

    if (forceAction) {
      currentInteraction.interactionLog.push({
        action: forceAction,
        tension: currentInteraction.tension,
      });
    }
  }
};

const updateTensionDraft = (state: StoreState, delta: number) => {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return null;
  interaction.tension += delta;
  return { type: 'modifyTension', delta } as const;
};

// Helper functions for service execution

/**
 * Determines if a service succeeds based on rule and effective relation
 */
const determineServiceSuccess = (
  rule: InteractionServiceRule | undefined,
  effectiveRelation: number,
  state: StoreState,
): { success: boolean; rollDetails?: StatRollResult } => {
  // Auto-success if no rule or high enough relation
  if (
    !rule ||
    rule.autoSuccessRelation === undefined ||
    effectiveRelation >= rule.autoSuccessRelation
  ) {
    return { success: true };
  }

  // Stat-based check
  if (rule.checkStat) {
    const rollDetails = rollStatCheck(state, {
      characterId: 'protagonist',
      stat: rule.checkStat,
      difficulty: rule.autoSuccessRelation - effectiveRelation,
    });
    return { success: rollDetails.success, rollDetails };
  }

  // Fallback: random chance
  const chance = 100 + effectiveRelation - rule.autoSuccessRelation;
  const roll = Math.floor(Math.random() * 100) + 1;
  return { success: roll <= chance };
};

/**
 * Constructs roll log from roll details if available
 */
const buildRollLog = (
  rule: InteractionServiceRule | undefined,
  rollDetails: StatRollResult | undefined,
): InteractionLogEvent['roll'] | undefined => {
  if (!rollDetails || !rule?.checkStat) return undefined;

  return {
    stat: rule.checkStat,
    rollValue: rollDetails.roll,
    targetValue: rollDetails.totalChance,
    difference: rollDetails.statValue - rollDetails.difficulty,
  };
};

export const interactionDraft = {
  startInteraction: startInteractionDraft,
  applyForceExitServices: applyForceExitServicesDraft,
  updateTension: updateTensionDraft,
};

export const createInteractionSlice: GameSlice<InteractionSlice> = (set, get) => ({
  currentInteraction: null,
  tensionById: {},

  actions: {
    startInteraction: (params) => {
      set((state) => {
        startInteractionDraft(state, params);
      });
    },

    updateTension: (delta) => {
      set((state) => {
        updateTensionDraft(state, delta);
      });
    },

    performService: (serviceId) => {
      // Phase 1: Determine outcome and resolve effects (outside draft - read phase)
      const state = get();
      const interaction = state.interactionSlice.currentInteraction;
      if (!interaction) return;

      const rule = SERVICE_RULES[serviceId];
      const { success: isSuccess, rollDetails } = determineServiceSuccess(
        rule,
        interaction.effectiveRelation,
        state,
      );

      const effectsToApply = isSuccess ? rule?.onSuccess : rule?.onFail;
      const rollLog = buildRollLog(rule, rollDetails);

      // Resolve effects in read phase (no draft state needed)
      let resolvedRules: ResolvedTriggerRules | undefined;
      if (effectsToApply?.length) {
        resolvedRules = resolveInteractionEffects(effectsToApply, {
          initiatorId: 'protagonist',
          targetCharacterId: interaction.npcId,
          targetFactionId: interaction.factionId,
        });
      }

      // Phase 2: Apply state changes (inside draft - write phase)
      set((draftState) => {
        const currentInteraction = draftState.interactionSlice.currentInteraction;
        if (!currentInteraction) return;

        const service = currentInteraction.services.find((s) => s.id === serviceId);
        if (!service) return;

        service.executedTimes += 1;

        // Apply effects and collect logs if they exist
        let effectLogs;
        if (resolvedRules) {
          effectLogs = EffectManager.processResolvedEffects(draftState, resolvedRules);
        }

        // Always log the interaction, even without effects
        if (!currentInteraction.interactionLog) {
          currentInteraction.interactionLog = [];
        }

        currentInteraction.interactionLog.push({
          action: serviceId,
          success: isSuccess,
          tension: currentInteraction.tension,
          roll: rollLog,
          effects: effectLogs,
        });

        // Check tension threshold
        applyForceTensionReactionDraft(draftState);
      });
    },

    applyForceExitServices: () => {
      set((state) => {
        applyForceExitServicesDraft(state);
      });
    },

    endInteraction: () => {
      set((state) => {
        const interaction = state.interactionSlice.currentInteraction;
        if (!interaction) return;

        state.interactionSlice.tensionById[interaction.npcId ?? interaction.poiId] =
          interaction.tension;
        state.interactionSlice.currentInteraction = null;
      });
    },

    clearAllTension: () => {
      set((state) => {
        state.interactionSlice.tensionById = {};
      });
    },
  },
});

/**
 * Селекторы (по аналогии с inventory).
 */
export const interactionSelectors = {
  selectCurrentInteraction: (state: StoreState) => state.interactionSlice.currentInteraction,

  selectCurrentTension: (state: StoreState) =>
    state.interactionSlice.currentInteraction?.tension ?? null,

  selectInitialTension: (state: StoreState) =>
    state.interactionSlice.currentInteraction?.initialTension ?? null,

  selectEffectiveRelation: (state: StoreState) =>
    state.interactionSlice.currentInteraction?.effectiveRelation ?? null,
};
