import tavernBackground from '@/assets/backgrounds/poi-demo/tavern.png';
import type { InitialFrameMap } from '@/types/frame.types';

/**
 * Технические фикстуры Frames.
 *
 * Покрывают: POI root, slot root, внутренние Frames обоих контекстов,
 * все три режима `npcDisplay`, наследование фона, Frame события Interceptor и
 * reserved `forceExit` Frame. У slot `visitor` forceExit-Frame намеренно
 * отсутствует: это проверяет тихий fallback.
 *
 * Таверна — техническая визуальная демонстрация POI UI. Background подключён
 * статическим import; это не утверждённый production-сюжет или баланс.
 */
export const FIXTURE_FRAMES: InitialFrameMap = {
  // ------------------------------------------------------------
  // POI root и внутренние Frames
  // ------------------------------------------------------------

  fixtureHub: {
    title: 'The Red Boar',
    background: tavernBackground,
    npcDisplay: 'none',
    narrative: [
      'Beyond the heavy door, the air smells of smoke, old wood and hot metal. Pipes hum overhead. Behind the counter, the innkeeper wipes a glass and watches everyone who enters.',
    ],
    actionIds: ['fixture:openInnerFrame'],
  },

  'fixtureHub:inner': {
    title: 'The back room',
    // background отсутствует → наследуется фон hub.
    npcDisplay: 'none',
    narrative: [
      'You step into the back room.',
      { thought: 'Only the actions of this scene are available here.' },
    ],
    actionIds: ['fixture:weightedSearch', 'fixture:backToRoot'],
  },

  'fixtureHub:event': {
    npcDisplay: 'none',
    narrative: ['An unexpected event interrupts your visit.'],
    actionIds: ['fixture:backToRoot'],
  },

  // ------------------------------------------------------------
  // Slot roots
  // ------------------------------------------------------------

  'fixtureHub/keeper': {
    npcDisplay: 'always',
    narrative: ['{$npc} looks up from work.', { speakerId: '$npc', text: 'Need something?' }],
    actionIds: [
      'fixture:statCheckPersuade',
      'fixture:skillCheckBarter',
      'fixture:chanceCheckAsk',
      'fixture:dailyRumor',
      'fixture:rareOffer',
      'fixture:conditionalRegionTalk',
      'fixture:requiresScrap',
      'fixture:openKeeperInner',
      'fixture:leaveSlot',
    ],
  },

  'fixtureHub/keeper:inner': {
    title: 'Business matters',
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'You have my attention.' }],
    actionIds: ['fixture:backToRoot'],
  },

  /** Reserved Frame принудительного выхода slot/NPC-контекста. */
  'fixtureHub/keeper:forceExit': {
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'We are done. Leave.' }],
    actionIds: ['fixture:forcedLeaveWithBan'],
  },

  /** forceExit Frame намеренно отсутствует: проверка тихого fallback. */
  'fixtureHub/visitor': {
    npcDisplay: 'speaker',
    narrative: [{ speakerId: '$npc', text: 'Hello.' }],
    actionIds: ['fixture:chatWithVisitor', 'fixture:provokeVisitor', 'fixture:leaveSlot'],
  },

  'fixtureHub/resident': {
    npcDisplay: 'always',
    narrative: ['{$npc} turns to you.'],
    actionIds: ['fixture:leaveSlot'],
  },

  // ------------------------------------------------------------
  // Дочерние POI
  // ------------------------------------------------------------

  fixtureOpenSite: {
    title: 'Tavern yard',
    background: tavernBackground,
    npcDisplay: 'none',
    narrative: ['An open yard behind the tavern.'],
  },

  fixtureClosedSite: {
    title: 'Workshop',
    npcDisplay: 'none',
    narrative: ['The workshop is only open at certain times.'],
  },

  fixtureHiddenSite: {
    title: 'Hidden passage',
    npcDisplay: 'none',
    narrative: ['A place that must be discovered first.'],
  },

  fixtureTempSite: {
    title: 'Temporary camp',
    npcDisplay: 'none',
    narrative: ['A temporary camp. It will be gone soon.'],
  },

  fixtureBlockedSite: {
    title: 'Private quarters',
    npcDisplay: 'none',
    narrative: ['You are not allowed inside yet.'],
  },

  fixtureDecaySite: {
    title: 'Abandoned sector',
    npcDisplay: 'none',
    narrative: ['Contamination grows here each day.'],
  },

  // ------------------------------------------------------------
  // Квестовые Frames
  // ------------------------------------------------------------

  'fixtureHub/keeper:questOffer': {
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'There is a job to do. Interested?' }],
    actionIds: ['fixture:acceptQuest', 'fixture:declineQuest'],
  },
};
