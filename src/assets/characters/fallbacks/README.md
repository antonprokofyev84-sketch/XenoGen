# Силуэты персонажей без индивидуальной картинки

Актуальная версия — `male-185-v2.png` и `female-170-v2.png`, тёмные фигуры в одежде.
Описание и промпты — в `README-v2.md`. Ниже сохранена история первой плоской
версии; её файлы больше не подключаются к приложению.

Созданы встроенным ImageGen 24 октября 2026. Женский вариант уточнён после
замечания пользователя: заметнее талия и бёдра, плечи уже, волосы до плеч.

- `male-185.png`: мужской силуэт, условный рост около 185 см, 948×1659 px.
- `female-170.png`: женский силуэт, условный рост около 170 см, 949×1658 px.

При пороге alpha > 16 видимая фигура занимает 77,64% и 71,71% высоты холста.
Отношение высот при одинаковой высоте показа — 0,924 (целевое 170/185 ≈ 0,919).
Центры силуэтов находятся на 49,43% и 50,03% высоты, углы прозрачны (alpha=0).

Оба файла — RGBA, полный рост, общий масштаб и примерно симметричные прозрачные
поля по вертикали. Разница размеров закодирована в заполнении холста, не в новых
игровых характеристиках роста. Импорты подключает `characterImageFallback.ts`.
Полные промпты ниже; промежуточные генерации не используются в runtime.

## Мужской силуэт — финальный промпт

Use case: stylized-concept. Asset type: generic male full-body fallback silhouette for a gritty postapocalyptic RPG character panel and dialogue overlay. Create ONE adult male silhouette, representing height 185 cm, average realistic build, broad but natural shoulders. Neutral upright relaxed pose, frontal or only very slight three-quarter angle, arms lowered with a small gap from torso, hands relaxed, feet apart just slightly, no perspective foreshortening. Entire head and both low-heeled shoes visible. Simple anonymous clothed human contour, no face, no eyes, no anatomical details, no textures or garment folds, no equipment, no props, no text, no frame. Solid muted medium charcoal grey with a very subtle warm grey rim to remain visible over dark scenes; restrained flat silhouette, not a glossy mannequin or photo. Actual transparent alpha everywhere outside the shape, no background, no floor or cast shadow. IMPORTANT shared framing: vertical canvas 768x1344, 4:7 matching existing project art. The visible human is about 1090 pixels high, about 81.1 percent of canvas height, centered BOTH horizontally and vertically: head at approximately y=127 and bottom of shoes at y=1217. Keep generous symmetrical transparent space above and below. Do NOT enlarge to fill the canvas. This common framing corresponds to a 210 cm reference taking about 92 percent height. No pedestal, no labels, no other people.

## Женский силуэт — финальный промпт

Use case: precise-object-edit. Edit this generic female game-placeholder silhouette so it is UNMISTAKABLY an adult woman at small UI size. Keep the same anonymous flat charcoal-grey silhouette fill, subtle warm-grey edge, full-body upright neutral frontal pose, flat shoes, transparent background, canvas size and body height. Keep head top at roughly y=237 and soles at y=1422 on the 948x1659 full canvas: 170 cm on the same scale as the existing male 185 cm counterpart. Change ONLY the outline: narrower gently sloping shoulders, a clearly defined natural waist, wider rounded hips relative to the shoulders, graceful slimmer forearms and calves, and a recognizable SHOULDER-LENGTH HAIR silhouette with a simple slightly outward curved bob around the sides of the head and neck. Natural adult female proportions, readable as a woman from contour alone, not an exaggerated pinup. Modest generic fitted clothing contour with no drawn details, no facial features, no textures, no breasts/anatomy lines, no nudity, no dress/skirt, no high heels or props. Preserve the generous symmetric empty transparent margins, the centered body, full head and both feet. Do not crop, zoom, change height, add a background, floor, shadow plane, UI, lettering or other people. Output genuine transparent PNG.

Вход женской финальной правки — первая женская генерация, созданная с мужским
силуэтом как референсом масштаба и стиля. Оригиналы остаются в каталоге
`C:/Users/Anton/.codex/generated_images/01a16d82-6610-7901-b107-bebe2ed999d7/`.
