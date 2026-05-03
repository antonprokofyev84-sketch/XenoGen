import type { PoiTemplateNarrativesMap } from '@/types/narrative.types';

/**
 * New canonical POI-template-based narratives.
 *
 * Structure:
 *   POI_NARRATIVES[poiTemplateId][action][outcome][narrativeKey] = NarrativeVariants
 */
export const POI_NARRATIVES: PoiTemplateNarrativesMap = {
  scavenger_group: {
    enter: {
      success: {
        default: [
          'You approach the group. They seem relaxed.',
          'The camp ahead looks peaceful enough.',
          'You spot a group ahead. They watch you cautiously.',
          'A small camp comes into view. No signs of hostility yet.',
          'Hostile figures block the path ahead.',
          'You stumble upon a camp. Weapons are already drawn.',
        ],
      },
    },
    trade: {
      success: {
        default: [
          'A fair deal is struck.',
          'They offer you good prices.',
          'After some haggling, a trade is made.',
        ],
      },
      fail: {
        default: [
          'They have nothing you need right now.',
          'They refuse to trade.',
          'No deal today.',
          'They would sooner kill you than trade with you.',
        ],
      },
    },
    attack: {
      success: {
        default: ['You strike first. The element of surprise is on your side.'],
      },
    },
    leave: {
      success: {
        default: ['You turn and walk away.', 'You leave without incident.'],
      },
    },
    testService: {
      success: {
        default: ['You test the waters.'],
      },
      fail: {
        default: ['The test falls flat.'],
      },
    },
    mock: {
      success: {
        default: ['You mock them openly. The tension spikes.'],
      },
    },
    forceLeave: {
      success: {
        default: [
          'They turn their backs. There is nothing to discuss.',
          'The scavengers glare. "We are done here. Move along."',
          'Scavengers wave you away. No more words, just distance.',
        ],
      },
    },
    forceAttack: {
      success: {
        default: [
          'Hands go to weapons. There is only one way this ends.',
          'Scavengers reach for blades and rifles. "Try us," they hiss.',
          'A scavenger chamber-clicks a round. You can only fight now.',
        ],
      },
    },
    forceRetreat: {
      success: {
        default: [
          'They look ready to strike, but you still have a chance to back off.',
          'The air is tense. You can retreat now or commit to a fight.',
          'Scavengers shift nervously. You can still retreat, but barely.',
        ],
      },
    },
  },

  scavenger_patrol: {
    enter: {
      success: {
        default: [
          'You approach the group. They seem relaxed.',
          'The camp ahead looks peaceful enough.',
          'You spot a group ahead. They watch you cautiously.',
          'A small camp comes into view. No signs of hostility yet.',
          'Hostile figures block the path ahead.',
          'You stumble upon a camp. Weapons are already drawn.',
        ],
      },
    },
    trade: {
      success: {
        default: [
          'A fair deal is struck.',
          'They offer you good prices.',
          'After some haggling, a trade is made.',
        ],
      },
      fail: {
        default: [
          'They have nothing you need right now.',
          'They refuse to trade.',
          'No deal today.',
          'They would sooner kill you than trade with you.',
        ],
      },
    },
    attack: {
      success: {
        default: ['You strike first. The element of surprise is on your side.'],
      },
    },
    leave: {
      success: {
        default: ['You turn and walk away.', 'You leave without incident.'],
      },
    },
    testService: {
      success: {
        default: ['You test the waters.'],
      },
      fail: {
        default: ['The test falls flat.'],
      },
    },
    mock: {
      success: {
        default: ['You mock them openly. The tension spikes.'],
      },
    },
    forceLeave: {
      success: {
        default: [
          'They turn their backs. There is nothing to discuss.',
          'The scavengers glare. "We are done here. Move along."',
          'Scavengers wave you away. No more words, just distance.',
        ],
      },
    },
    forceAttack: {
      success: {
        default: [
          'Hands go to weapons. There is only one way this ends.',
          'Scavengers reach for blades and rifles. "Try us," they hiss.',
          'A scavenger chamber-clicks a round. You can only fight now.',
        ],
      },
    },
    forceRetreat: {
      success: {
        default: [
          'They look ready to strike, but you still have a chance to back off.',
          'The air is tense. You can retreat now or commit to a fight.',
          'Scavengers shift nervously. You can still retreat, but barely.',
        ],
      },
    },
  },

  tavern: {
    enter: {
      success: {
        default: [
          'The tavern breathes heat, smoke, and the sour comfort of spilled ale. Conversations stay low and guarded, but the room still feels more welcoming than the road outside.',
          'Warm lamplight settles over scarred tables and patched coats as you step inside. Nobody offers a greeting, yet the hearth and the noise make it clear that strangers are expected here.',
        ],
      },
    },
    rest: {
      success: {
        default: [
          'You pay for a narrow cot upstairs and finally let the weight leave your shoulders for a few hours. The mattress is thin and the walls are loud, but the rest still feels earned.',
          'The tavern finds you a cramped room and a bed that has seen better winters. It is not comfort in any noble sense, yet sleep comes faster here than it ever would on the road.',
        ],
      },
      fail: {
        default: [
          'You ask for a bed, but the price stops the exchange before it truly starts. The tavern keeps its warmth, and you keep standing in your travel-worn clothes.',
          'There is room to rest, but not for free, and your purse does not carry enough weight to argue otherwise. The offer disappears as quickly as it was made.',
        ],
      },
    },
    leave: {
      success: {
        default: [
          'You leave the tavern behind with the smell of smoke and beer still clinging to your clothes. The noise of the common room folds shut behind the door as if you were never there.',
          'The warmth falls away the moment you step outside. Behind you, the tavern returns to its own low murmur and private business.',
        ],
      },
    },
  },

  tavern_bartender_spot: {
    enter: {
      success: {
        default: [
          [
            'You make your way to the counter through a press of tired patrons and overturned stories. The bartender looks up from a half-polished glass with a stare that weighs more than the bottle in their hand.',
            {
              speaker: 'bartender',
              text: 'If you want something, ask now. I do not sell extra patience.',
            },
          ],
          'You stop at the bar while the bartender closes a ledger and gives you their full attention. It is not a friendly welcome, but it is the sort that usually leads to business.',
        ],
      },
    },
    trade: {
      success: {
        default: [
          [
            'The bartender slides the goods onto the scarred wood and names a price that sounds final rather than fair. Coins pass hands quickly while the rest of the room pretends not to listen.',
            { speaker: 'bartender', text: 'Take what you came for and keep the haggling short.' },
          ],
          'The deal is struck with practiced speed. By the time the coins stop moving, the bartender is already reaching for the next bottle and the next problem.',
        ],
      },
      fail: {
        default: [
          [
            'The bartender closes the ledger with two fingers and leaves the goods where they are. Whatever chance the deal had, it dies before either of you bothers to dress it up.',
            {
              speaker: 'bartender',
              text: 'Not today. Either your offer is light, or my mood is worse.',
            },
          ],
          'You try to turn the conversation toward trade, but the bartender meets the attempt with a flat refusal. The bar remains open, yet the deal is closed.',
        ],
      },
    },
    leave: {
      success: {
        default: [
          'You step back from the counter and let the next thirsty voice take your place. The bartender has already moved on, giving you no more attention than the empty glass in their hand.',
          'You leave the bar to the regulars and their unfinished complaints. Behind you, the bartender returns to counting bottles, coins, and grudges.',
        ],
      },
    },
  },

  tavern_waitress_spot: {
    enter: {
      success: {
        default: [
          [
            'You catch the waitress at the edge of the room as she slips between chairs with a tray balanced on one hand. She slows just enough to hear you, though her eyes are already on the next table that needs her.',
            {
              speaker: 'waitress',
              text: 'If you need something, make it quick. Half the room asked before you.',
            },
          ],
          'The waitress moves through the crowd with the calm precision of someone who has learned to ignore half the noise around her. When you stop her, she grants you a moment and no more than that.',
        ],
      },
    },
    leave: {
      success: {
        default: [
          'You let the waitress return to her circuit of mugs, plates, and impatient hands. Within a breath she is swallowed again by the rhythm of the room.',
          'You step aside before becoming one more delay in a night already full of them. The waitress is gone again almost before the exchange is over.',
        ],
      },
    },
  },

  tavern_free_table: {
    enter: {
      success: {
        default: [
          'The free table sits a little apart from the louder drinkers, its surface etched with initials, knife marks, and the pale circles of old mugs. It feels like the sort of place meant for watching first and speaking later.',
          'An empty chair waits beside a scarred table near the wall. From here you can watch the room without being forced into its noise, which is its own kind of comfort.',
        ],
      },
    },
    leave: {
      success: {
        default: [
          'You leave the table as you found it, with only a little warmth fading from the wood where your hands had rested. The tavern absorbs your brief claim to the corner without comment.',
          'You rise from the chair and the corner becomes anonymous again at once. Around you, the tavern goes on with the practiced indifference of a place that sees too many passing faces.',
        ],
      },
    },
  },
};
