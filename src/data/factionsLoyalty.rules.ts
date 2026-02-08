export type LoyaltyProfile = {
  personalWeight: number; // 0..1
};

export type ResolvedLoyaltyProfile = {
  personalWeight: number;
  factionWeight: number;
};

const DEFAULT_PROFILE: LoyaltyProfile = { personalWeight: 1 };

export const FACTION_PROFILES: Record<string, LoyaltyProfile> = {
  raiders: { personalWeight: 0.9 },
  cult: { personalWeight: 0.2 },
  scavengers: { personalWeight: 0.6 },
};

export function getLoyaltyProfile(factionId: string): ResolvedLoyaltyProfile {
  let profile: LoyaltyProfile = FACTION_PROFILES[factionId];
  if (!profile) {
    console.warn(`No loyalty profile for factionId="${factionId}", using default.`);
    profile = DEFAULT_PROFILE;
  }

  return {
    personalWeight: profile.personalWeight,
    factionWeight: 1 - profile.personalWeight,
  };
}
