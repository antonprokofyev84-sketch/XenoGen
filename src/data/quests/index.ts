import type {
  QuestDefinitionMap,
  QuestNarrativesDatabase,
  QuestServicesDatabase,
} from '@/types/quest.types';

import {
  bringFoodForMaraQuest,
  bringFoodForMaraQuestNarratives,
  bringFoodForMaraQuestServices,
} from './bringFoodForMara.quest';
import {
  huntScavengersForMaraQuest,
  huntScavengersForMaraQuestNarratives,
  huntScavengersForMaraQuestServices,
} from './huntScavengersForMara.quest';
import {
  talkToLenaQuest,
  talkToLenaQuestNarratives,
  talkToLenaQuestServices,
} from './talkToLena.quest';

export {
  bringFoodForMaraQuest,
  bringFoodForMaraQuestNarratives,
  bringFoodForMaraQuestServices,
  huntScavengersForMaraQuest,
  huntScavengersForMaraQuestNarratives,
  huntScavengersForMaraQuestServices,
  talkToLenaQuest,
  talkToLenaQuestNarratives,
  talkToLenaQuestServices,
};

export const QUESTS_DB = {
  talkToLena: talkToLenaQuest,
  bringFoodForMara: bringFoodForMaraQuest,
  huntScavengersForMara: huntScavengersForMaraQuest,
} satisfies QuestDefinitionMap;

export const QUEST_SERVICES_DB = {
  talkToLena: talkToLenaQuestServices,
  bringFoodForMara: bringFoodForMaraQuestServices,
  huntScavengersForMara: huntScavengersForMaraQuestServices,
} satisfies QuestServicesDatabase;

export const QUEST_NARRATIVES_DB = {
  talkToLena: talkToLenaQuestNarratives,
  bringFoodForMara: bringFoodForMaraQuestNarratives,
  huntScavengersForMara: huntScavengersForMaraQuestNarratives,
} satisfies QuestNarrativesDatabase;