// import { BUDGET_FOR_LEVEL } from '@/data/combat.rules';
// import { POI_TEMPLATES_DB } from '@/data/poi.templates';
// import type { StoreState } from '@/state/useGameState';
// import { generateEnemyGroup } from '@/systems/combat/enemyGroupGenerator';
// import { EffectManager } from '@/systems/effects/effectManager';
// import { enemyRegistry } from '@/systems/enemy/enemyRegistry';
// import { poiManager } from '@/systems/poi/poiManager';
// import type {
//   ActivePoi,
//   CombatPoiDetails,
//   EffectsMap,
//   PoiDetails,
//   PoiType,
// } from '@/types/poi.types';

// import type { GameSlice } from '../types';
// import { mapSelectors } from './map_outdated';

// const SOFT_CAP = 6;

// export interface PoiSlice {
//   poisByCellId: Record<string, ActivePoi[]>;

//   actions: {
//     initializePois: (initialData: Record<string, ActivePoi[]>) => void;
//     addPoiToCell: (cellId: string, poiId: string, force?: boolean) => void;
//     addPoiInRadius: (
//       centerCellId: string,
//       poiTplId: string,
//       radius: number,
//       chance?: number,
//       force?: boolean,
//     ) => void;
//     explorePoisInCell: (cellId: string, explorationLevel: number) => void;
//     ensurePoiDetails: (cellId: string, poiId: string) => void;
//     changePoiDetails: (cellId: string, poiId: string, newDetails: PoiDetails) => void;
//     removePoiFromCell: (cellId: string, poiId: string) => void;
//     modifyPoiProgress: (cellId: string, poiId: string, delta: number) => void;
//     processDayEnd: () => Record<string, EffectsMap>;
//   };
// }

// export const poiSelectors = {
//   selectPoisByCellId:
//     (cellId: string) =>
//     (state: StoreState): ActivePoi[] => {
//       return state.pois.poisByCellId[cellId] ?? [];
//     },

//   selectVisiblePoisByCellId:
//     (cellId: string) =>
//     (state: StoreState): ActivePoi[] => {
//       if (!cellId) return [];

//       const cellData = mapSelectors.selectCellById(cellId)(state);
//       const allPoisInCell = poiSelectors.selectPoisByCellId(cellId)(state);

//       const isCellExplored =
//         cellData.explorationDaysLeft === null ||
//         (cellData.explorationDaysLeft && cellData.explorationDaysLeft > 0);

//       if (isCellExplored) {
//         return allPoisInCell.filter((poi) => poi.isDiscovered);
//       } else {
//         const keyTypes: PoiType[] = ['settlement', 'base', 'quest'];
//         return allPoisInCell.filter((poi) => poi.isDiscovered && keyTypes.includes(poi.type));
//       }
//     },
//   selectSelectedPoi: (state: StoreState) => {
//     const selectedCellId = state.map.selectedCellId;
//     const selectedPoiId = state.map.selectedPoiId;
//     if (!selectedCellId || !selectedPoiId) return null;

//     const poisInCell = poiSelectors.selectPoisByCellId(selectedCellId)(state);
//     const selectedPoiData = poisInCell.find((poi) => poi.id === selectedPoiId) || null;
//     return selectedPoiData;
//   },
// };

// export const createPoiSlice: GameSlice<PoiSlice> = (set, get) => ({
//   poisByCellId: {},
//   actions: {
//     initializePois: (initialData) => {
//       set((state) => {
//         state.pois.poisByCellId = initialData;
//       });
//     },
//     addPoiToCell: (cellId, poiId, force = false) => {
//       set((state) => {
//         const list = state.pois.poisByCellId[cellId];
//         const cell = state.map.cells[cellId];

//         if (!force && list.length >= SOFT_CAP) return;

//         const inst = poiManager.getPoiInstance(poiId);
//         if (!inst) return;

//         inst.id = `${poiId}_${cellId}_${Date.now()}`;
//         // if isDiscovered is true in template, it means it's always discovered
//         inst.isDiscovered = inst.isDiscovered || inst.perceptionThreshold <= cell.explorationLevel;
//         list.push(inst);
//       });
//     },
//     addPoiInRadius: (centerCellId, poiTplId, radius, chance = 1, force = false) => {
//       const cellIds = poiManager.getCellIdsInRadius({
//         radius,
//         center: centerCellId,
//       });

//       set((state) => {
//         for (const cellId of cellIds) {
//           if (chance !== 1 && Math.random() >= chance) continue;

//           const cell = state.map.cells[cellId];
//           const list = state.pois.poisByCellId[cellId];
//           if (!list) continue;
//           if (!force && list.length >= SOFT_CAP) continue;

//           const inst = poiManager.getPoiInstance(poiTplId);
//           if (!inst) continue;

//           inst.id = `${poiTplId}_${cellId}_${Date.now()}`;
//           inst.isDiscovered =
//             inst.isDiscovered || inst.perceptionThreshold <= cell.explorationLevel;
//           list.push(inst);
//         }
//       });
//     },
//     explorePoisInCell: (cellId, explorationLevel) => {
//       set((state) => {
//         const pois = state.pois.poisByCellId[cellId] ?? [];

//         for (const poi of pois) {
//           if (poi.isDiscovered) continue;
//           if (poi.perceptionThreshold <= explorationLevel) {
//             poi.isDiscovered = true;
//           }
//         }
//       });
//     },
//     ensurePoiDetails: (cellId, poiId) => {
//       set((state) => {
//         const poi = state.pois.poisByCellId[cellId]?.find((p) => p.id === poiId);
//         if (!poi || poi.details) {
//           return;
//         }

//         let newDetails: PoiDetails | null = null;

//         switch (poi.type) {
//           case 'combat':
//           case 'boss': {
//             const allowedTemplates = enemyRegistry.getByFaction(poi.faction || 'scavengers');
//             const difficultyLevel = poi.difficulty || 1;

//             if (allowedTemplates.length > 0) {
//               const enemyGroup = generateEnemyGroup({
//                 difficultyLevel: difficultyLevel,
//                 budget: BUDGET_FOR_LEVEL[difficultyLevel],
//                 allowedTemplates: allowedTemplates,
//               });
//               newDetails = { enemyGroup } as CombatPoiDetails;
//             }
//             break;
//           }
//           case 'loot': {
//             // Здесь в будущем будет логика генерации лута
//             console.log(`[ensurePoiDetails] TODO: Generate loot for ${poi.id}`);
//             break;
//           }
//           default:
//             // Для этого типа POI детали не нужны
//             return;
//         }

//         if (newDetails) {
//           poi.details = newDetails;
//         }
//       });
//     },
//     changePoiDetails: (cellId, poiId, newDetails) => {
//       set((state) => {
//         const poi = state.pois.poisByCellId[cellId]?.find((p) => p.id === poiId);
//         if (!poi) return;

//         poi.details = newDetails;
//       });
//     },
//     removePoiFromCell: (cellId, poiId) =>
//       set((state) => {
//         const currentPois = state.pois.poisByCellId[cellId] ?? [];
//         state.pois.poisByCellId[cellId] = currentPois.filter((poi) => poi.id !== poiId);
//       }),

//     modifyPoiProgress: (cellId, poiId, delta) => {
//       let effects: Record<string, EffectsMap> | null = null;

//       set((state) => {
//         const poi = state.pois.poisByCellId[cellId]?.find((p) => p.id === poiId);
//         if (!poi) return;

//         const template = POI_TEMPLATES_DB[poi.poiTemplateId];
//         const progressMax = template?.progressMax ?? 100;

//         const newProgress = (poi.progress ?? 0) + delta;
//         poi.progress = Math.max(0, Math.min(newProgress, progressMax));

//         if (poi.progress === progressMax) {
//           if (template?.triggers?.onProgressMax) {
//             effects = { [cellId]: { [poi.id]: template.triggers.onProgressMax } };
//           }
//         }
//       });

//       if (effects) {
//         EffectManager.processPoiEffects(effects, { state: get() });
//       }
//     },

//     processDayEnd: () => {
//       const { poisByCellId } = get().pois;
//       const cellIds = Object.keys(poisByCellId);
//       const allEffects: Record<string, EffectsMap> = {};

//       set((state) => {
//         for (const cellId of cellIds) {
//           const currentPois = poisByCellId[cellId] ?? [];
//           const { updatedPois, effects } = poiManager.computeOnDayPassForPoi(currentPois);

//           state.pois.poisByCellId[cellId] = updatedPois;
//           if (effects) {
//             allEffects[cellId] = effects;
//           }
//         }
//       });
//       console.log(allEffects);
//       return allEffects;
//     },
//   },
// });
