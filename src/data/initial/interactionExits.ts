import { t } from '@/systems/text/i18n';
import type { InitialActionMap } from '@/types/action.types';
import type { InitialFrameMap } from '@/types/frame.types';

export const CONTEXT_EXIT_FRAMES = {
  poiClosed: 'system:poiClosed',
  npcLeft: 'system:npcLeft',
} as const;

export const CONTEXT_EXIT_ACTIONS: InitialActionMap = {
  'system:leaveClosedPoi': {
    label: t('interactionUi.leave'),
    result: { transition: { type: 'parentPoi' } },
  },
  'system:endUnavailableConversation': {
    label: t('interactionUi.endTalk'),
    result: { transition: { type: 'currentPoi' } },
  },
};

export const CONTEXT_EXIT_FRAME_DEFINITIONS: InitialFrameMap = {
  [CONTEXT_EXIT_FRAMES.poiClosed]: {
    npcDisplay: 'none',
    narrative: [t('interactionUi.poiClosed')],
    actionIds: ['system:leaveClosedPoi'],
  },
  [CONTEXT_EXIT_FRAMES.npcLeft]: {
    npcDisplay: 'none',
    narrative: [t('interactionUi.npcLeft')],
    actionIds: ['system:endUnavailableConversation'],
  },
};
