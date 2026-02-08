import type { BasePoiNode, CellDetails, EncounterDetails, PoiType } from './poi.types';

type InitialBasePoiNode = Omit<BasePoiNode, 'childrenIds'>;

export type InitialCellDetails = Pick<CellDetails, 'col' | 'row' | 'terrain'> &
  Partial<Omit<CellDetails, 'col' | 'row' | 'terrain'>>;

export type InitialEncounterDetails = Omit<
  EncounterDetails,
  'isDiscovered' | 'explorationThreshold'
> & {
  isDiscovered?: boolean;
  explorationThreshold?: number;
};

export interface InitialCellPoiNode extends InitialBasePoiNode {
  type: 'cell';
  parentId: null;
  details: InitialCellDetails;
}

export interface InitialEncounterPoiNode extends InitialBasePoiNode {
  type: 'encounter';
  parentId: string;
  details: InitialEncounterDetails;
}

export interface InitialGenericPoiNode extends InitialBasePoiNode {
  type: Exclude<PoiType, 'cell' | 'encounter'>;
  parentId: string;
  details: Record<string, any>;
}

/* =====================
   Union
===================== */

export type InitialPoi = InitialCellPoiNode | InitialEncounterPoiNode | InitialGenericPoiNode;
