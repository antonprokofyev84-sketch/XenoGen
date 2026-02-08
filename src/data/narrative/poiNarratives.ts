import type { PoiNarrativesMap } from '@/types/narrative.types';

/**
 * POI-type-level narrative texts (fallback when no NPC narrative is found).
 *
 * Structure:
 *   poiNarratives[poiType][action][mood].success/fail.generalText | factionOverrides
 */
export const poiNarratives: PoiNarrativesMap = {
  encounter: {
    enter: {
      friendly: {
        success: {
          generalText: [
            'You approach the group. They seem relaxed.',
            'The camp ahead looks peaceful enough.',
          ],
        },
      },
      neutral: {
        success: {
          generalText: [
            'You spot a group ahead. They watch you cautiously.',
            'A small camp comes into view. No signs of hostility yet.',
          ],
        },
      },
      hostile: {
        success: {
          generalText: [
            'Hostile figures block the path ahead.',
            'You stumble upon a camp. Weapons are already drawn.',
          ],
        },
      },
    },
    trade: {
      friendly: {
        success: {
          generalText: ['A fair deal is struck.', 'They offer you good prices.'],
        },
        fail: {
          generalText: ['They have nothing you need right now.'],
        },
      },
      neutral: {
        success: {
          generalText: ['After some haggling, a trade is made.'],
        },
        fail: {
          generalText: ['They refuse to trade.', 'No deal today.'],
        },
      },
      hostile: {
        fail: {
          generalText: ['They would sooner kill you than trade with you.'],
        },
      },
    },
    attack: {
      neutral: {
        success: {
          generalText: ['You strike first. The element of surprise is on your side.'],
        },
      },
    },
    leave: {
      neutral: {
        success: {
          generalText: ['You turn and walk away.', 'You leave without incident.'],
        },
      },
    },
    testService: {
      neutral: {
        success: {
          generalText: ['You test the waters.'],
        },
        fail: {
          generalText: ['The test falls flat.'],
        },
      },
    },
    mock: {
      neutral: {
        success: {
          generalText: ['You mock them openly. The tension spikes.'],
        },
      },
    },
    forceLeave: {
      neutral: {
        success: {
          generalText: ['They turn their backs. There is nothing to discuss.'],
          factionOverrides: {
            scavengers: [
              'The scavengers glare. "We are done here. Move along."',
              'Scavengers wave you away. No more words, just distance.',
            ],
          },
        },
      },
    },
    forceAttack: {
      neutral: {
        success: {
          generalText: ['Hands go to weapons. There is only one way this ends.'],
          factionOverrides: {
            scavengers: [
              'Scavengers reach for blades and rifles. "Try us," they hiss.',
              'A scavenger chamber-clicks a round. You can only fight now.',
            ],
          },
        },
      },
    },
    forceRetreat: {
      neutral: {
        success: {
          generalText: [
            'They look ready to strike, but you still have a chance to back off.',
            'The air is tense. You can retreat now or commit to a fight.',
          ],
          factionOverrides: {
            scavengers: ['Scavengers shift nervously. You can still retreat, but barely.'],
          },
        },
      },
    },
  },

  loot: {
    enter: {
      neutral: {
        success: {
          generalText: [
            'Something catches your eye among the debris.',
            'You find an abandoned stash.',
          ],
        },
      },
    },
  },
};
