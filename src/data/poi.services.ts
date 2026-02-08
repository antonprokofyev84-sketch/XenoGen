// вместо массива сервисов для каждой точки интереса можно описать условия доступности сервисов
// например, в зависимости от репутации игрока с владельцем точки интереса
import type {
  InteractionService,
  InteractionServiceRule,
  InteractionServiceState,
} from '@/types/interaction.types';

//this need to be refactored later may be based on poi templateId as a key
export const POI_SERVICES: Record<string, InteractionService[]> = {
  encounter: ['attack', 'trade', 'leave', 'testService', 'mock'],
  forceLeave: ['leave'],
  forceAttack: ['attack'],
  forceRetreat: ['attack', 'retreat'],
};

export const POI_SERVICES_INITIAL_STATE: Record<InteractionService, InteractionServiceState> = {
  attack: { id: 'attack', executedTimes: 0 },
  trade: { id: 'trade', executedTimes: 0 },
  talk: { id: 'talk', executedTimes: 0 },
  leave: { id: 'leave', executedTimes: 0 },
  retreat: { id: 'retreat', executedTimes: 0 },
  testService: { id: 'testService', executedTimes: 0, maxExecutions: 3 },
  mock: { id: 'mock', executedTimes: 0 },
};

export const getServiceNamesById = (id: string) => {
  return POI_SERVICES[id] ? [...POI_SERVICES[id]] : [];
};

export const getServicesState = (serviceNames: InteractionService[]): InteractionServiceState[] => {
  return serviceNames.map((serviceId) => ({
    ...POI_SERVICES_INITIAL_STATE[serviceId],
  }));
};

// возможно дельту стои сделать или числом или функцией от колличества вызовов (executedTimes)
// так же для простоты можно добавить deltaArray: number[] - где индекс это executedTimes
// пока оставим просто числом

export const SERVICE_RULES: Partial<Record<InteractionService, InteractionServiceRule>> = {
  attack: {
    onSuccess: [
      { type: 'modifyFactionReputation', delta: -5 },
      { type: 'modifyTargetAffection', delta: -10 },
    ],
  },
  trade: {
    autoSuccessRelation: 20,
    checkStat: 'charisma',
    onFail: [{ type: 'modifyTension', delta: 10 }],
  },
  talk: {
    autoSuccessRelation: 10,
    checkStat: 'charisma',
    onFail: [{ type: 'modifyTension', delta: 10 }],
  },
  testService: {
    autoSuccessRelation: 30,
    checkStat: 'charisma',
    onSuccess: [{ type: 'modifySkill', skill: 'charisma', delta: 2 }],
    onFail: [{ type: 'modifyTension', delta: 20 }],
  },
  mock: {
    onSuccess: [
      { type: 'modifyTension', delta: 80 },
      { type: 'modifyTargetAffection', delta: -20 },
    ],
  },
};
