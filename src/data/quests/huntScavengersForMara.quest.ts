import type { QuestDefinition, QuestNarrativesMap, QuestServicesMap } from '@/types/quest.types';

export const huntScavengersForMaraQuest = {
  name: 'Quiet The Road',
  description:
    'Mara wants the nearby scavengers thinned out before they start preying on her regulars.',
  category: 'side',
  stages: {
    initialStage: {
      targetId: 'test_bartender',
      serviceId: 'huntScavengersForMara_offerJob',
      effects: [{ type: 'setQuestStage', stageId: 'reportAfterHunt' }],
    },

    reportAfterHunt: {
      title: 'Cull The Scavengers',
      description: 'Defeat 5 scavengers, then return to Mara Voss for payment.',
      targetId: 'test_bartender',
      serviceId: 'huntScavengersForMara_report',
      visibilityConditions: [{ type: 'defeated', enemyTypeId: 'scavenger', min: 5 }],
      effects: [
        { type: 'addItem', itemId: 'scrap', count: 35 },
        { type: 'modifyFactionReputation', delta: 2 },
        { type: 'completeQuest' },
      ],
    },
  },
} satisfies QuestDefinition;

export const huntScavengersForMaraQuestServices = {
  huntScavengersForMara_offerJob: {
    label: 'Offer to handle the scavengers',
  },
  huntScavengersForMara_report: {
    label: 'Report the scavengers dealt with',
  },
} satisfies QuestServicesMap;

export const huntScavengersForMaraQuestNarratives = {
  huntScavengersForMara_offerJob: {
    success: {
      default: [
        'Mara jerks her head toward the road outside.',
        '"Too many scavengers between here and the old tracks. Put five of them down and come back."',
      ],
    },
  },
  huntScavengersForMara_report: {
    success: {
      default: [
        'Mara studies you for a moment, then gives a sharp nod.',
        '"Good. Fewer scavengers means more customers making it here alive."',
      ],
    },
  },
} satisfies QuestNarrativesMap;
