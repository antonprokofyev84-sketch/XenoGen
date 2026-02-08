import type { NpcNarrativesMap } from '@/types/narrative.types';

/**
 * NPC-specific narrative texts.
 *
 * Structure:
 *   npcNarratives[npcId][action][mood].success/fail.generalText | poiTypeOverrides
 *   npcNarratives[npcId].enter[mood].generalText | poiTypeOverrides
 *
 * Add entries here when a specific NPC needs unique reaction lines.
 */
export const npcNarratives: NpcNarrativesMap = {
  // ─── Example NPC ───
  // 'npc_merchant_01': {
  //   enter: {
  //     friendly: {
  //       generalText: [
  //         'The merchant waves at you warmly.',
  //         '"Welcome back, friend!" the merchant exclaims.',
  //       ],
  //     },
  //     neutral: {
  //       generalText: [
  //         'The merchant glances at you cautiously.',
  //       ],
  //     },
  //     hostile: {
  //       generalText: [
  //         'The merchant scowls as you approach.',
  //       ],
  //     },
  //   },
  //   trade: {
  //     friendly: {
  //       success: {
  //         generalText: [
  //           'The merchant gives you a fair price.',
  //           '"For you, a special deal," they say.',
  //         ],
  //       },
  //       fail: {
  //         generalText: [
  //           'The merchant shakes their head. "Not today."',
  //         ],
  //       },
  //     },
  //   },
  // },
};
