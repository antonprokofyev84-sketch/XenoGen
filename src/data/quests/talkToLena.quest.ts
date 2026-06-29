import type { QuestDefinition, QuestNarrativesMap, QuestServicesMap } from '@/types/quest.types';

export const talkToLenaQuest = {
  name: 'A Word For Lena',
  description: 'Mara Voss asks you to pass a message to Lena Pike and return with an answer.',
  category: 'side',
  stages: {
    initialStage: {
      targetId: 'test_bartender',
      serviceId: 'talkToLena_offerWork',
      effects: [{ type: 'setQuestStage', stageId: 'talkToLena' }],
    },

    talkToLena: {
      title: 'Speak With Lena',
      description: 'Mara asked you to find Lena Pike in the tavern and pass along her message.',
      targetId: 'test_waitress',
      serviceId: 'talkToLena_deliverMessage',
      effects: [
        { type: 'modifyTargetAffection', delta: 5 },
        { type: 'setQuestStage', stageId: 'reportBack' },
      ],
    },

    reportBack: {
      title: 'Return To Mara',
      description: 'Tell Mara that Lena accepted the message and will act on it soon.',
      targetId: 'test_bartender',
      serviceId: 'talkToLena_reportBack',
      effects: [
        { type: 'modifySkill', skill: 'charisma', delta: 1 },
        { type: 'completeQuest' },
      ],
    },
  },
} satisfies QuestDefinition;

export const talkToLenaQuestServices = {
  talkToLena_offerWork: {
    label: 'Ask Mara about work',
  },
  talkToLena_deliverMessage: {
    label: 'Pass Mara\'s message to Lena',
  },
  talkToLena_reportBack: {
    label: 'Report back to Mara',
  },
} satisfies QuestServicesMap;

export const talkToLenaQuestNarratives = {
  talkToLena_offerWork: {
    success: {
      default: [
        'Mara wipes a glass, then leans closer.',
        '"Find Lena for me. She owes me an answer, and I trust you more than the drunks."',
      ],
    },
  },
  talkToLena_deliverMessage: {
    success: {
      default: [
        'Lena listens in silence, then nods once.',
        '"Fine. Tell Mara I\'ll handle it before nightfall."',
      ],
    },
  },
  talkToLena_reportBack: {
    success: {
      default: [
        'Mara exhales in relief when she hears Lena\'s answer.',
        '"Good. That saves me a long evening. You did clean work."',
      ],
    },
  },
} satisfies QuestNarrativesMap;