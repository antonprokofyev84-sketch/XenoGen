import { PROTAGONIST_ID } from '@/constants';
import { SERVICE_RULES, getServiceNamesById, getServicesState } from '@/data/poi.services';
import { EffectManager } from '@/systems/effects/effectManager';
import {
  computeInitialTension,
  resolveEffectiveRelation,
  resolveInteractionEffects,
} from '@/systems/interaction/interactionRules';
import { rollStatCheck } from '@/systems/rolls/statRollService';
import type { ResolvedTriggerRules } from '@/types/effects.types';
import type {
  ForceBehavior,
  InteractionLogEvent,
  InteractionService,
  InteractionServiceRule,
  InteractionServiceState,
  ServiceOutcome,
} from '@/types/interaction.types';
import type { NonCellNode } from '@/types/poi';

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
  /** Number of trade attempts in this interaction (for experience diminishing returns) */
  tradeAttempts: number;
  interactionLog: InteractionLogEvent[];
  services: InteractionServiceState[];
}

/** Persisted interaction state (without log), survives across visits within a day */
export type InteractionMemory = Omit<CurrentInteraction, 'interactionLog'>;

export interface InteractionSlice {
  currentInteraction: CurrentInteraction | null;
  isTrading: boolean;

  /** Persisted interaction snapshots, keyed by npcId or poiId. Cleared at end of day. */
  interactionMemoryById: Record<string, InteractionMemory>;

  actions: {
    startInteraction: (params: {
      poiId: string;
      effectiveRelation?: number;
      initialTension?: number;
    }) => void;
    performService: (
      serviceId: InteractionService,
      ruleOverride?: Partial<InteractionServiceRule>,
      characterId?: string,
    ) => ServiceOutcome | undefined;
    updateTension: (delta: number) => void;
    openTrade: () => void;
    closeTrade: () => void;
    endInteraction: () => void;
    clearDailyMemory: () => void;
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
    factionId = poi?.details && 'faction' in poi.details ? poi.details.faction : undefined;
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

  const key = npcId ?? poiId;
  const memory = state.interactionSlice.interactionMemoryById[key];

  // If we have a stored memory, restore it with a fresh log
  if (memory) {
    state.interactionSlice.currentInteraction = {
      ...memory,
      interactionLog: [{ action: 'enter', success: true, tension: memory.tension }],
    };
    applyForceTensionReactionDraft(state);
    return;
  }

  if (initialTension === undefined) {
    initialTension = computeInitialTension(effectiveRelation);
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
    tradeAttempts: 0,
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

    if (forceAction) {
      currentInteraction.interactionLog.push({
        action: forceAction,
        tension: currentInteraction.tension,
      });
    }

    // Close trade modal if force-exit triggers while trading
    state.interactionSlice.isTrading = false;
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
 * Resolves a service attempt into a ServiceOutcome.
 *
 * Resolution order:
 * 1. No rule at all → auto-success
 * 2. autoSuccessRelation defined and relation meets threshold → auto-success
 * 3. checkStat defined → stat roll (uses rule.difficulty if set, else relation-derived difficulty)
 * 4. difficulty defined without checkStat → pure d100 vs difficulty
 * 5. Fallback → auto-success
 */
const resolveService = (
  rule: InteractionServiceRule | undefined,
  effectiveRelation: number,
  state: StoreState,
  characterId: string = PROTAGONIST_ID,
): ServiceOutcome => {
  // 1. No rule → auto-success
  if (!rule) return { success: true };

  // 2. Auto-success by relation threshold
  if (rule.autoSuccessRelation !== undefined && effectiveRelation >= rule.autoSuccessRelation) {
    return { success: true };
  }

  // 3. Stat check
  if (rule.checkStat) {
    const difficulty =
      rule.difficulty ??
      (rule.autoSuccessRelation !== undefined ? rule.autoSuccessRelation - effectiveRelation : 50);

    const rollDetails = rollStatCheck(state, {
      characterId,
      stat: rule.checkStat,
      difficulty,
    });

    return {
      success: rollDetails.success,
      rollLog: {
        stat: rule.checkStat,
        rollValue: rollDetails.roll,
        targetValue: rollDetails.totalChance,
        difference: rollDetails.statValue - rollDetails.difficulty,
      },
      effects: rollDetails.success ? rule.onSuccess : rule.onFail,
    };
  }

  // 4. Pure difficulty check (no stat)
  if (rule.difficulty !== undefined) {
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= 100 - rule.difficulty;
    return {
      success,
      rollLog: {
        rollValue: roll,
        targetValue: 100 - rule.difficulty,
        difference: 100 - rule.difficulty - roll,
      },
      effects: success ? rule.onSuccess : rule.onFail,
    };
  }

  // 5. Relation-derived random chance (legacy path: autoSuccessRelation set but no stat/difficulty)
  if (rule.autoSuccessRelation !== undefined) {
    const chance = 100 + effectiveRelation - rule.autoSuccessRelation;
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= chance;
    return {
      success,
      effects: success ? rule.onSuccess : rule.onFail,
    };
  }

  // 6. No checks defined → auto-success
  return { success: true, effects: rule.onSuccess };
};

const endInteractionDraft = (state: StoreState) => {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  const key = interaction.npcId ?? interaction.poiId;
  const { interactionLog, ...memory } = interaction;
  state.interactionSlice.interactionMemoryById[key] = memory;
  state.interactionSlice.currentInteraction = null;
};

export const interactionDraft = {
  startInteraction: startInteractionDraft,
  applyForceExitServices: applyForceExitServicesDraft,
  updateTension: updateTensionDraft,
  endInteraction: endInteractionDraft,
};

export const createInteractionSlice: GameSlice<InteractionSlice> = (set, get) => ({
  currentInteraction: null,
  isTrading: false,
  interactionMemoryById: {},

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

    openTrade: () => {
      set((state) => {
        state.interactionSlice.isTrading = true;
      });
    },

    closeTrade: () => {
      set((state) => {
        state.interactionSlice.isTrading = false;
      });
    },

    // here we can pass completely custom rule which is not defined in SERVICE_RULES, for example for quest-specific services
    performService: (serviceId, ruleOverride, characterId) => {
      // Phase 1: Determine outcome and resolve effects (outside draft - read phase)
      const state = get();
      const interaction = state.interactionSlice.currentInteraction;
      if (!interaction) return undefined;

      const staticRule = SERVICE_RULES[serviceId];
      const rule: InteractionServiceRule | undefined = ruleOverride
        ? { ...staticRule, ...ruleOverride }
        : staticRule;

      const outcome = resolveService(rule, interaction.effectiveRelation, state, characterId);
      const effectsToApply = outcome.effects ?? (outcome.success ? rule?.onSuccess : rule?.onFail);

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

        // Track execution count for registered services; unregistered services (e.g. tradeOffer) skip tracking
        const service = currentInteraction.services.find((s) => s.id === serviceId);
        if (service) {
          service.executedTimes += 1;
        }

        // Track trade attempts for experience diminishing returns
        if (serviceId === 'tradeOffer') {
          currentInteraction.tradeAttempts += 1;
        }

        // Apply effects and collect logs if they exist
        let effectLogs;
        if (resolvedRules) {
          effectLogs = EffectManager.processResolvedEffects(draftState, resolvedRules);
        }

        // Always log the interaction, even without effects
        currentInteraction.interactionLog.push({
          action: serviceId,
          success: outcome.success,
          tension: currentInteraction.tension,
          roll: outcome.rollLog,
          effects: effectLogs,
        });

        // Open trade modal on successful trade service
        if (serviceId === 'trade' && outcome.success) {
          draftState.interactionSlice.isTrading = true;
        }

        // Check tension threshold
        applyForceTensionReactionDraft(draftState);
      });

      return outcome;
    },

    applyForceExitServices: () => {
      set((state) => {
        applyForceExitServicesDraft(state);
      });
    },

    endInteraction: () => {
      set((state) => {
        endInteractionDraft(state);
      });
    },

    clearDailyMemory: () => {
      set((state) => {
        state.interactionSlice.interactionMemoryById = {};
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
