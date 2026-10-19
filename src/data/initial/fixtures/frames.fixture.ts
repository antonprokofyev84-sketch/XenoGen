import type { InitialFrameMap } from '@/types/frame.types';

/**
 * Технические фикстуры Frames.
 *
 * Покрывают: POI root, slot root, внутренние Frames обоих контекстов,
 * все три режима `npcDisplay`, наследование фона, Frame события Interceptor и
 * reserved `forceExit` Frame. У slot `visitor` forceExit-Frame намеренно
 * отсутствует: это проверяет тихий fallback.
 *
 * Background задан строкой-плейсхолдером: реальные assets подключаются
 * статическим import вместе с настоящим контентом.
 */
export const FIXTURE_FRAMES: InitialFrameMap = {
  // ------------------------------------------------------------
  // POI root и внутренние Frames
  // ------------------------------------------------------------

  fixtureHub: {
    background: '/images/poi/fixture-hub.webp',
    npcDisplay: 'none',
    narrative: ['Технический хаб. Нейтральная площадка для проверки контрактов.'],
    actionIds: ['fixture:openInnerFrame', 'fixture:jumpToOpenSite'],
  },

  'fixtureHub:inner': {
    // background отсутствует → наследуется фон hub.
    npcDisplay: 'none',
    narrative: [
      'Внутренний кадр хаба.',
      { thought: 'Отсюда доступны только собственные действия кадра.' },
    ],
    actionIds: ['fixture:weightedSearch', 'fixture:backToRoot'],
  },

  'fixtureHub:event': {
    npcDisplay: 'none',
    narrative: ['Сработало автоматическое событие входа.'],
    actionIds: ['fixture:backToRoot'],
  },

  // ------------------------------------------------------------
  // Slot roots
  // ------------------------------------------------------------

  'fixtureHub/keeper': {
    npcDisplay: 'always',
    narrative: [
      '{$npc} отрывается от работы.',
      { speakerId: '$npc', text: 'Нужно что-то по делу?' },
    ],
    actionIds: [
      'fixture:statCheckPersuade',
      'fixture:skillCheckBarter',
      'fixture:chanceCheckAsk',
      'fixture:dailyRumor',
      'fixture:oneTimeGift',
      'fixture:rareOffer',
      'fixture:conditionalRegionTalk',
      'fixture:requiresScrap',
      'fixture:openKeeperInner',
      'fixture:leaveSlot',
    ],
  },

  'fixtureHub/keeper:inner': {
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'Слушаю.' }],
    actionIds: ['fixture:backToRoot'],
  },

  /** Reserved Frame принудительного выхода slot/NPC-контекста. */
  'fixtureHub/keeper:forceExit': {
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'Разговор окончен. Уходи.' }],
    actionIds: ['fixture:forcedLeaveWithBan'],
  },

  /** forceExit Frame намеренно отсутствует: проверка тихого fallback. */
  'fixtureHub/visitor': {
    npcDisplay: 'speaker',
    narrative: [{ speakerId: '$npc', text: 'Привет.' }],
    actionIds: ['fixture:chatWithVisitor', 'fixture:provokeVisitor', 'fixture:leaveSlot'],
  },

  'fixtureHub/resident': {
    npcDisplay: 'speaker',
    narrative: ['{$npc} занят своими делами.'],
    actionIds: ['fixture:leaveSlot'],
  },

  // ------------------------------------------------------------
  // Дочерние POI
  // ------------------------------------------------------------

  fixtureOpenSite: {
    background: '/images/poi/fixture-open-site.webp',
    npcDisplay: 'none',
    narrative: ['Открытая площадка.'],
  },

  fixtureClosedSite: {
    npcDisplay: 'none',
    narrative: ['Площадка, доступная не в любое время суток.'],
  },

  fixtureHiddenSite: {
    npcDisplay: 'none',
    narrative: ['Место, которое нужно сначала найти.'],
  },

  fixtureTempSite: {
    npcDisplay: 'none',
    narrative: ['Временная стоянка. Скоро её здесь не будет.'],
  },

  fixtureBlockedSite: {
    npcDisplay: 'none',
    narrative: ['Внутрь пока не пускают.'],
  },

  fixtureDecaySite: {
    npcDisplay: 'none',
    narrative: ['Заражение здесь растёт день ото дня.'],
  },

  // ------------------------------------------------------------
  // Квестовые Frames
  // ------------------------------------------------------------

  'fixtureHub/keeper:questOffer': {
    npcDisplay: 'always',
    narrative: [{ speakerId: '$npc', text: 'Есть поручение. Возьмёшься?' }],
    actionIds: ['fixture:acceptQuest', 'fixture:declineQuest'],
  },
};
