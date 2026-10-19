import type { InitialNpcMap, NpcBaseSchedule } from '@/types/npcContent.types';

/**
 * Технические фикстуры NPC.
 *
 * Покрывают: рабочее расписание, свободное время, домашнее размещение,
 * нескольких кандидатов на один slot, чужую фракцию для условий репутации и
 * незнакомого NPC для intro-Interceptor.
 */

const WORKER_SCHEDULE: NpcBaseSchedule = {
  late_night: 'home',
  early_morning: 'home',
  morning: 'work',
  afternoon: 'work',
  evening: 'work',
  night: 'home',
};

const VISITOR_SCHEDULE: NpcBaseSchedule = {
  late_night: 'home',
  early_morning: 'home',
  morning: 'freeTime',
  afternoon: 'freeTime',
  evening: 'freeTime',
  night: 'freeTime',
};

const RESIDENT_SCHEDULE: NpcBaseSchedule = {
  late_night: 'home',
  early_morning: 'home',
  morning: 'home',
  afternoon: 'freeTime',
  evening: 'home',
  night: 'home',
};

const HIDDEN_SCHEDULE: NpcBaseSchedule = {
  late_night: 'hidden',
  early_morning: 'hidden',
  morning: 'hidden',
  afternoon: 'hidden',
  evening: 'hidden',
  night: 'hidden',
};

export const FIXTURE_NPCS: InitialNpcMap = {
  /** Работник hub: занимает work slot, пока POI открыт. */
  fixtureKeeper: {
    name: 'Fixture Keeper',
    faction: 'independents',
    affection: 10,
    baseSchedule: WORKER_SCHEDULE,
    actionIds: ['fixture:askKeeperAboutSite'],
    interceptorIds: ['fixture:keeperIntro'],
  },

  /** Первый кандидат на freeTime slot. */
  fixtureVisitorA: {
    name: 'Fixture Visitor A',
    faction: 'independents',
    baseSchedule: VISITOR_SCHEDULE,
  },

  /** Второй кандидат на тот же slot: проверяет случайный выбор из нескольких. */
  fixtureVisitorB: {
    name: 'Fixture Visitor B',
    faction: 'independents',
    affection: -20,
    baseSchedule: VISITOR_SCHEDULE,
  },

  /** Житель: занимает home slot. */
  fixtureResident: {
    name: 'Fixture Resident',
    faction: 'independents',
    baseSchedule: RESIDENT_SCHEDULE,
  },

  /** Чужая фракция и нулевой `timesMet` для проверки репутации и знакомства. */
  fixtureStranger: {
    name: 'Fixture Stranger',
    faction: 'scavengers',
    affection: -10,
    baseSchedule: VISITOR_SCHEDULE,
  },

  /** Никогда не размещается: проверяет состояние `hidden`. */
  fixtureGhost: {
    name: 'Fixture Ghost',
    faction: 'independents',
    timesMet: 2,
    baseSchedule: HIDDEN_SCHEDULE,
  },
};
