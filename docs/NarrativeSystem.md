Narrative System Design (v1)

1. Purpose

Narrative system handles:

- enter descriptions
- action result descriptions
- optional dialogue-like lines inside narrative variants

It is based on `poiTemplateId`.

`poiTemplateId` is the main group.
Specific narrative variants are resolved inside that template group by priority keys.

2. Narrative key priority

Priority from high to low:

1. `{npcId}_{poiId}`
   Specific NPC in a specific place.

2. `{npcId}`
   Specific NPC at any spot of this template type.

3. `defaultOwner_{poiId}`
   Generic owner/NPC in a specific place.

4. `defaultOwner`
   Generic owner/NPC for this template type.

5. `{poiId}`
   Empty specific place.

6. `default`
   Fallback for the template.

7. Data shape

Structure:

POI_NARRATIVES
-> poiTemplateId
-> action
-> outcome
-> narrativeKey
-> narrative variants

Example:

export const POI_NARRATIVES = {
tavern_bartender_spot: {
enter: {
success: {
john_Bar01: [
'В "Старом Баре" пахнет элем. Джон протирает стакан и кивает вам.',

          [
            'Вы подходите к стойке.',
            { speaker: 'john', text: 'Снова ты.' },
            'Джон не прекращает протирать стакан, но взгляд у него становится тяжелее.',
          ],
        ],

        john: [
          'Джон стоит за стойкой и бросает на вас короткий взгляд.',
        ],

        defaultOwner_Bar01: [
          'Бармен за стойкой "Старого Бара" оценивающе смотрит на вас.',
        ],

        defaultOwner: [
          'Бармен поднимает взгляд, когда вы подходите к стойке.',
        ],

        Bar01: [
          'Дубовая стойка "Старого Бара" покрыта царапинами и следами кружек.',
        ],

        default: [
          'Вы подходите к барной стойке.',
        ],
      },
    },

    trade: {
      success: {
        john_Bar01: [
          [
            'Джон нехотя выкладывает товар на стойку.',
            { speaker: 'john', text: 'Быстро выбирай. Я не весь день тут стою.' },
          ],
        ],

        defaultOwner: [
          'Бармен называет цену и ждёт вашего ответа.',
        ],

        default: [
          'Сделка проходит без лишних слов.',
        ],
      },

      fail: {
        john_Bar01: [
          [
            'Джон даже не тянется к товару.',
            { speaker: 'john', text: 'Для тебя сегодня ничего нет.' },
          ],
        ],

        defaultOwner: [
          'Бармен качает головой. Сделки не будет.',
        ],

        default: [
          'Ничего не выходит.',
        ],
      },
    },

},
};

4. Narrative variant format

External array means variants.

Each variant can be:

A) Simple text variant:

'Вы подходите к барной стойке.'

B) Composite variant:

[
'Вы подходите к стойке.',
{ speaker: 'john', text: 'Снова ты.' },
'В комнате становится тише.',
]

Types:

type DialogueLine = {
speaker: string;
text: string;
};

type NarrativeBlock = string | DialogueLine;

type NarrativeVariant = string | NarrativeBlock[];

type NarrativeVariants = NarrativeVariant[];

5. Meaning of arrays

Important rule:

- outer array = random variants
- inner array = ordered narrative blocks within one variant

Example:

john_Bar01: [
'Simple variant one.',

[
'Composite variant start.',
{ speaker: 'john', text: 'Dialogue line.' },
'Composite variant end.',
],
]

This means:

- choose either simple variant or composite variant
- if composite variant is chosen, render all blocks in order

6. Resolver algorithm

Input:

- poiTemplateId
- action
- outcome
- npcId optional
- poiId
- hasOwner

Step 1:
Open:

POI_NARRATIVES[poiTemplateId][action][outcome]

Step 2:
Build priority keys:

If npcId exists:

1. `${npcId}_${poiId}`
2. `${npcId}`

If owner exists: 3. `defaultOwner_${poiId}` 4. `defaultOwner`

Always: 5. `${poiId}` 6. `default`

Step 3:
Find first existing key.

Step 4:
Pick random variant from that key.

Step 5:
Normalize result:

- if variant is string -> [variant]
- if variant is array -> variant

Final output is always:

NarrativeBlock[]

7. Optional mood support for future

Mood can be added later only where needed.

Current simple format:

john_Bar01: [
'Text variant.'
]

Future mood format:

john_Bar01: {
hostile: [
'Hostile text variant.'
],

friendly: [
'Friendly text variant.'
],

default: [
'Default text variant.'
],
}

Mood resolver:

- try selected mood
- fallback to default

This does not need to be added now.

8. Rules

- Base grouping is always `poiTemplateId`.
- `default` should exist for each important action/outcome.
- Use specific keys only when needed.
- Do not split dialogue into a separate system for now.
- Dialogue lines are just blocks inside a narrative variant.
- Keep external arrays as random variants.
- Keep inner arrays as ordered blocks.
- Use same key logic for image resolver if useful.

9. Summary

Narrative is resolved as:

poiTemplateId
-> action
-> outcome
-> best available narrative key
-> random variant
-> normalized blocks

Key priority:

1. `{npcId}_{poiId}`
2. `{npcId}`
3. `defaultOwner_{poiId}`
4. `defaultOwner`
5. `{poiId}`
6. `default`

TODO
Переменные в текстах
Базовый fallback для отсутствующих действий
