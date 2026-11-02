# Тёмные фигуры-заглушки — версия 2

Созданы встроенным ImageGen 24 октября 2026 после замечания пользователя:
плоские серые силуэты не соответствовали реалистичному NPC и были слишком мелкими.

- `male-185-v2.png`: тёмная обезличенная мужская фигура, условный рост около 185 см.
- `female-170-v2.png`: женская фигура, условный рост около 170 см.

Оба холста — 948×1659 px. При alpha > 16 видимые границы: мужская фигура
y=19..1618 (96,38% высоты), женская y=96..1537 (86,86%). Вертикальные центры
на 49,34% и 49,22% соответственно. Углы прозрачны. Рост обозначает ориентир
иллюстрации, а не новую числовую характеристику персонажа.

Универсальная одежда, закрытое тенью лицо без узнаваемых черт, мягкие складки и
тёплый контурный свет. Реальная alpha; полный рост, центрирование и общий масштаб.
Оба импортируются `characterImageFallback.ts`; первая версия сохранена как архив
и не включается в сборку. Референсы: первая версия соответствующего силуэта и
`src/assets/npcs/fixtureKeeper/full-body.png` как ориентир фактуры, света и масштаба.

## Мужская фигура — полный промпт

Use case: style-transfer. Game asset: anonymous full-body placeholder for a gritty cyber-postapocalyptic RPG, painted realistically like the BARTENDER reference (image 2). Image 1 is the old flat placeholder to redesign. Replace the flat vector-like grey mannequin with a dark, atmospheric, faceless human SHADOW FIGURE in simple practical clothing: very dark muted olive-charcoal work shirt/jacket, trousers and flat boots; softly visible fabric folds and subtle body volume, subdued warm amber rim lighting matching the bartender. Most of the figure remains in shadow, especially the face: NO identifiable face, NO visible eyes, NO shiny featureless mannequin skin, NO pale white outline, NO sticker border. This must still read as an anonymous SILHOUETTE placeholder, not a detailed individual NPC portrait. No weapons or accessories. Quiet natural standing pose, arms relaxed close to body, realistic anatomy. Entire head and both boots visible, transparent alpha outside figure, no background, floor, cast-shadow plane, UI or text. Keep the 4:7 vertical canvas. Keep the body horizontally and vertically centered. Change the amount of empty space as specified rather than retaining the excessive empty margins of image 1. Adult male, average build, represents 185 cm. Visible body occupies about 96 percent of canvas height, symmetric 2 percent transparent top and bottom margins, matching the bartender's full-body framing and apparent physical size. On a 948x1659 canvas: head near y=33, boot bottoms near y=1626. The male body should look substantial and present in the scene, not undersized. Simple short hair mostly lost in shadow.

## Женская фигура — полный промпт

Use case: style-transfer. Game asset: anonymous full-body placeholder for a gritty cyber-postapocalyptic RPG, painted realistically like the BARTENDER reference (image 2). Image 1 is the old flat placeholder to redesign. Replace the flat vector-like grey mannequin with a dark, atmospheric, faceless human SHADOW FIGURE in simple practical clothing: very dark muted olive-charcoal work shirt/jacket, trousers and flat boots; softly visible fabric folds and subtle body volume, subdued warm amber rim lighting matching the bartender. Most of the figure remains in shadow, especially the face: NO identifiable face, NO visible eyes, NO shiny featureless mannequin skin, NO pale white outline, NO sticker border. This must still read as an anonymous SILHOUETTE placeholder, not a detailed individual NPC portrait. No weapons or accessories. Quiet natural standing pose, arms relaxed close to body, realistic anatomy. Entire head and both boots visible, transparent alpha outside figure, no background, floor, cast-shadow plane, UI or text. Keep the 4:7 vertical canvas. Keep the body horizontally and vertically centered. Change the amount of empty space as specified rather than retaining the excessive empty margins of image 1. Adult female, average build, represents 170 cm, clearly feminine but modest natural proportions: narrower shoulders, defined waist, wider hips, shoulder-length bob hair. A companion male185 silhouette occupies96 percent canvas height. Therefore this woman's visible body must occupy 170/185\*96 = 88.2 percent of the canvas height, with symmetric 5.9 percent transparent top and bottom margins. On a 948x1659 canvas: head near y=98, boot bottoms near y=1561. Do not enlarge her to the same visible height as the male or bartender. Preserve the readable female contour while adding dark clothing volume and warm lighting.
