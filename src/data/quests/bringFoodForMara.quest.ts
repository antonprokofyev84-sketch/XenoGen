import type { QuestDefinition, QuestNarrativesMap, QuestServicesMap } from '@/types/quest.types';

export const bringFoodForMaraQuest = {
  name: 'Bar Stock',
  description: 'Mara Voss needs extra rations for the tavern and will pay in scrap.',
  category: 'side',
  stages: {
    initialStage: {
      targetId: 'test_bartender',
      serviceId: 'bringFoodForMara_offerJob',
      effects: [{ type: 'setQuestStage', stageId: 'bringFood' }],
    },

    bringFood: {
      title: 'Bring Food To Mara',
      description: 'Collect 10 food packs and return them to Mara Voss at the tavern.',
      targetId: 'test_bartender',
      serviceId: 'bringFoodForMara_turnIn',
      visibilityConditions: [{ type: 'item', itemId: 'food', min: 10 }],
      effects: [
        { type: 'removeItem', itemId: 'food', count: 10 },
        { type: 'addItem', itemId: 'scrap', count: 20 },
        { type: 'completeQuest' },
      ],
    },
  },
} satisfies QuestDefinition;

export const bringFoodForMaraQuestServices = {
  bringFoodForMara_offerJob: {
    label: 'Ask Mara what she needs',
  },
  bringFoodForMara_turnIn: {
    label: 'Hand over 10 food',
  },
} satisfies QuestServicesMap;

export const bringFoodForMaraQuestNarratives = {
  bringFoodForMara_offerJob: {
    success: {
      default: [
        'Mara taps the nearly empty pantry shelf behind the counter.',
        '"Bring me ten food packs and I\'ll make it worth your time."',
      ],
    },
  },
  bringFoodForMara_turnIn: {
    success: {
      default: [
        'Mara counts the rations quickly and stacks them under the bar.',
        '"That keeps the place alive for a few more nights. Here, take this."',
      ],
    },
  },
} satisfies QuestNarrativesMap;