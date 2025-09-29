export type FactionStatus = 'enemy' | 'neutral' | 'ally' | 'player';

export interface FactionRelation {
  reputation: number;
  status: FactionStatus;
}
