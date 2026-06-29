import type { PoiTemplateNarrativesMap } from '@/types/narrative.types';

/**
 * New canonical POI-template-based narratives.
 *
 * Structure:
 *   POI_NARRATIVES[poiType][action][outcome][narrativeKey] = NarrativeVariants
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
        occupied: [
          'The tavern is alive with working hands and watchful eyes. Someone tends the room, and the place feels held together by routine rather than luck.',
          'You step into a tavern that is clearly staffed and running. The hearth is fed, the tables are watched, and the room carries the order of people doing their jobs.',
        ],
        empty: [
          'The tavern stands open, but something is missing. The hearth still burns and the benches still wait, yet no one seems to be keeping the place together.',
          'You enter a tavern that should feel busy, but instead it feels unattended. The room has warmth, smoke, and noise in its walls, but no visible hand guiding any of it.',
        ],
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
    intro: {
      success: {
        occupied: [
          'Behind the counter, a bartender keeps the bottles, coins, and rumors in motion with practiced economy.',
          'The bar is manned. Glass catches the lamplight while the bartender watches the room without seeming to move much at all.',
        ],
        empty: [
          'The bar stands unattended, littered with bottles, damp rings, and the residue of a shift that ended without ceremony.',
          'No one is at the counter. The place where the bartender should be is empty, leaving the bar looking strangely exposed.',
        ],
      },
    },
    enter: {
      success: {
        occupied: [
          [
            'You make your way to the counter and find the bartender already studying you over the rim of a half-cleaned glass.',
            {
              speaker: 'bartender',
              text: 'If you came for a drink, speak. If you came for trouble, make it quick.',
            },
          ],
          'You step up to a working bar. The bartender closes a ledger, sizes you up, and waits for you to justify the interruption.',
        ],
        empty: [
          'You approach the bar, but there is no bartender waiting there. Only abandoned bottles, a stained rag, and the smell of old ale answer you.',
          'The counter is empty when you reach it. Whatever business is usually done here will have to wait for someone to return.',
        ],
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
    intro: {
      success: {
        // occupied: [
        //   'A waitress cuts through the room with the speed of someone balancing too many orders and not enough patience.',
        //   'The floor is being worked by a tired waitress who knows every obstacle in the room before it moves.',
        // ],
        // empty: [
        //   'No serving hand passes through this part of the tavern right now. The tables wait with dirty mugs and no one to clear them.',
        //   'The space where a waitress should be moving stays oddly still, leaving a small gap in the rhythm of the room.',
        // ],
      },
    },
    enter: {
      success: {
        occupied: [
          [
            'You catch the waitress between two tables as she shifts a tray onto one hip and gives you a brief, exhausted look.',
            {
              speaker: 'waitress',
              text: 'Say it quickly. The room is thirsty and I only have two hands.',
            },
          ],
          'You stop the waitress in the middle of her route. She grants you a sliver of attention, the sort reserved for customers who might still be worth the delay.',
        ],
        empty: [
          'You look for the waitress here, but no one comes. The path between the tables is open, unclaimed, and briefly quieter for it.',
          'There is no waitress nearby to stop. The work continues elsewhere, leaving this corner without service for the moment.',
        ],
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
    intro: {
      success: {
        occupied: [
          'The table is not free after all. Someone has claimed it with a posture that suggests they noticed you noticing.',
          "A patron sits at the table now, turning what should be a quiet corner into someone else's territory.",
        ],
        empty: [
          'A free table waits near the wall, marked by old cuts in the wood and the pale rings of long-emptied cups.',
          "One table remains open, a small island of space inside the tavern's low noise and slow heat.",
        ],
      },
    },
    enter: {
      success: {
        occupied: [
          'You drift toward the table, only to find it already taken. Whoever sits there makes it clear with a glance that the seat is not yours.',
          'The corner table has an occupant now, and your approach earns the sort of brief territorial stare common in places like this.',
        ],
        empty: [
          'The table is free when you reach it, scarred by years of mugs, knives, and quiet waiting. It offers privacy without comfort.',
          'You take in the empty chair and open tabletop. For a tavern corner, it is almost inviting.',
        ],
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
