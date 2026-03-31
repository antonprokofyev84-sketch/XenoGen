// вместо массива сервисов для каждой точки интереса можно описать условия доступности сервисов
// например, в зависимости от репутации игрока с владельцем точки интереса
import type {
  InteractionService,
  InteractionServiceRule,
  InteractionServiceState,
} from '@/types/interaction.types';

//this need to be refactored later may be based on poi templateId as a key
export const POI_SERVICES: Record<string, InteractionService[]> = {
  encounter: [
    'attack',
    'trade',
    'leave',
    'testService',
    'mock',
    'testDex',
    'testStr',
    'testSurvival',
    'testLuck',
  ],
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
  testDex: { id: 'testDex', executedTimes: 0, maxExecutions: 2 },
  testStr: { id: 'testStr', executedTimes: 0, maxExecutions: 2 },
  testSurvival: { id: 'testSurvival', executedTimes: 0, maxExecutions: 2 },
  testLuck: { id: 'testLuck', executedTimes: 0, maxExecutions: 2 },
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
  // Stat check with fixed difficulty
  testDex: {
    checkStat: 'dex',
    difficulty: 40,
    onSuccess: [{ type: 'modifySkill', skill: 'melee', delta: 1 }],
    onFail: [{ type: 'modifyTension', delta: 15 }],
  },
  testStr: {
    checkStat: 'str',
    difficulty: 50,
    onSuccess: [{ type: 'modifySkill', skill: 'melee', delta: 1 }],
    onFail: [{ type: 'modifyTension', delta: 15 }],
  },
  testSurvival: {
    checkStat: 'survival',
    difficulty: 35,
    onSuccess: [{ type: 'modifySkill', skill: 'survival', delta: 2 }],
    onFail: [{ type: 'modifyTension', delta: 10 }],
  },
  // Pure difficulty check — no stat, just d100 vs difficulty
  testLuck: {
    difficulty: 60,
    onSuccess: [{ type: 'modifyTargetAffection', delta: 5 }],
    onFail: [{ type: 'modifyTension', delta: 25 }],
  },
};
