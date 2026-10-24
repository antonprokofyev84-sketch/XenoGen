# POI demo art

Generated with the built-in ImageGen tool using the user's attached POI screenshot
as a visual reference. These are separate illustrative assets; all UI is React/SCSS.

- `backgrounds/poi-demo/tavern.png`: widescreen interior, no interface or foreground NPC.
- `npcs/fixtureKeeper/default.png`: RGBA cutout figure, alpha channel verified.
- `npcs/fixtureKeeper/portrait.png`: independently generated head-and-shoulders portrait.

## Final prompts

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
