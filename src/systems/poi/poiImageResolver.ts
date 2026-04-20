/**
 * POI Image Resolver — cascading fallback system for POI scene backgrounds.
 *
 * Uses `import.meta.glob` to build a build-time index of available images
 * under `public/images/poi/`. At runtime, `resolvePoiImage` walks a 6-level
 * priority chain and returns the path of the first match.
 *
 * Folder structure: /images/poi/{poiTemplateId}/{candidate}.{webp|png}
 *
 * Priority (high → low):
 *  1. {npcId}_{poiId}   — specific NPC in a specific place
 *  2. {npcId}            — NPC at any spot of this template type
 *  3. defaultOwner_{poiId} — generic NPC in a specific place
 *  4. defaultOwner       — generic NPC for this template type
 *  5. {poiId}            — empty specific place
 *  6. default            — fallback for the template
 */

const EXTENSIONS = ['.webp', '.png'] as const;
const FALLBACK_IMAGE = '/images/poi/default.png';

// Build-time glob: keys are paths like "/images/poi/tavern/default.png"
// We only need the keys to know which files exist — never call the loaders.
const globResult = import.meta.glob<unknown>('/public/images/poi/**/*.{webp,png}');

const availableImages: Set<string> = new Set(
  Object.keys(globResult).map((key) => key.replace(/^\/public/, '')),
);

function findImage(basePath: string, name: string): string | null {
  for (const ext of EXTENSIONS) {
    const candidate = `${basePath}/${name}${ext}`;
    if (availableImages.has(candidate)) return candidate;
  }
  return null;
}

/**
 * Resolve the best available image for a POI scene.
 *
 * @param poiTemplateId — e.g. "tavern_bartender_spot"
 * @param poiId         — unique instance id, e.g. "test_tavern_bartender_spot" (optional)
 * @param npcId         — NPC owner id if present, e.g. "john" (optional)
 * @returns root-relative image path (e.g. "/images/poi/tavern/default.png")
 */
export function resolvePoiImage(
  poiTemplateId: string,
  poiId?: string | null,
  npcId?: string | null,
): string {
  const base = `/images/poi/${poiTemplateId}`;

  // 1. {npcId}_{poiId}
  if (npcId && poiId) {
    const found = findImage(base, `${npcId}_${poiId}`);
    if (found) return found;
  }

  // 2. {npcId}
  if (npcId) {
    const found = findImage(base, npcId);
    if (found) return found;
  }

  // 3. defaultOwner_{poiId}
  if (npcId && poiId) {
    const found = findImage(base, `defaultOwner_${poiId}`);
    if (found) return found;
  }

  // 4. defaultOwner
  if (npcId) {
    const found = findImage(base, 'defaultOwner');
    if (found) return found;
  }

  // 5. {poiId}
  if (poiId) {
    const found = findImage(base, poiId);
    if (found) return found;
  }

  // 6. default
  {
    const found = findImage(base, 'default');
    if (found) return found;
  }

  return FALLBACK_IMAGE;
}
