# POI demo art

Generated with the built-in ImageGen tool using the user's attached POI screenshot
as a visual reference. These are separate illustrative assets; all UI is React/SCSS.

- `backgrounds/poi-demo/tavern.png`: widescreen interior, no interface or foreground NPC.
- `npcs/fixtureKeeper/full-body.png`: full-body RGBA figure, 948×1659 (4:7), used by the resolver.
- `npcs/fixtureKeeper/portrait.webp`: 200×200 runtime portrait, approximately 11 KB.
- `npcs/fixtureKeeper/portrait.source.png`: original 1254×1254 portrait, excluded from the resolver and build.

## Final prompts

Full-body revision (built-in ImageGen, 24 October 2026):
“Use case: identity-preserve. Asset: full-body transparent PNG game NPC figure,
canvas 768x1344 (4:7). Image 1 is the edit target: older male bartender Bob.
Image 2 is only the full-body framing reference, NOT character/clothing reference.
Extend/recompose image 1 to show Bob's ENTIRE standing body from top of hair to
bottoms of both boots. Preserve his recognizable face, greying brown hair and
beard, olive rolled-sleeve shirt, brown worn leather apron and hands holding cloth.
Add natural dark trousers and worn practical leather boots matching him.
Realistic painterly game art with existing warm lighting. Center standing human
with realistic proportions, relaxed narrow stance, both feet visible on same
baseline. Body height 90-95 percent of canvas, small transparent padding above
hair and below soles; no cropped limbs, no oversized torso, no closeup. Entire
background must be actual fully transparent alpha, no brown/black backdrop, no
floor, no shadow plane, no text or UI. Keep hands near waist rather than wide
extended pose. Render ONLY the full-body bartender.”

Inputs: existing `default.png` and `public/images/characters/player/protagonist_0.png`.
The full-body output is 948×1659 px. Preparation and display rules: [visual assets](../../docs/new/visual-assets.md).

Background: “Use case: stylized-concept. Asset type: widescreen 16:9 game scene background.
Reference image is the visual style and interior composition reference only. Create the
interior background of this same gritty underground cyber postapocalyptic tavern,
rusty ceiling pipes and cables, battered CRT terminals, worn metal walls, amber lamps
with subtle muted green neon, wooden and metal bar and tables, a few small distant
patrons. Wide cinematic camera, detailed realistic painterly game art. Remove ALL UI
panels, borders, text, typography, buttons, overlays and the large foreground bartender.
Background ONLY, no large foreground people. Keep room empty enough on left foreground
for a separately rendered character. Match the dark warm brown/bronze, olive palette,
low lighting and worn tactile materials of the supplied image. Landscape 1600x900
composition, no text, no watermark.”

Figure final edit: “Remove the ENTIRE brown and black background from this image.
Output a genuinely transparent PNG with alpha channel surrounding the man. This is
a game cutout asset, not a portrait on a background. Keep only the same man, hair,
face, clothes, apron and cloth unchanged. All pixels outside his silhouette must be
fully transparent, NOT black, NOT brown, NOT a checkerboard painted background.
Preserve soft edges and hair, warm lighting on the character. Do not change composition,
pose, character identity or crop. No environment and no ground shadow. Transparent
background extraction.”

Portrait: “Asset: square small game NPC portrait, face and shoulders of ONLY the older
male bartender in the supplied reference. Match his rugged grey brown hair, beard,
friendly tired face, olive shirt and leather apron. Painterly realistic postapocalyptic
RPG character art, warm amber side lighting, simple dark olive backdrop. Close
head-and-shoulders crop, centered face, no UI or text. This is a separate portrait
asset for a small character card.”
