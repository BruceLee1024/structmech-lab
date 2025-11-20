export enum ModuleType {
  BEAM = 'beam',
  TRUSS = 'truss',
  FRAME = 'frame',
  VIBRATION = 'vibration',
  MOHR = 'mohr',
  BUCKLING = 'buckling',
  SECTION = 'section',
  CONCRETE = 'concrete'
}

export interface Point {
  x: number;
  y: number;
}

export interface TrussNode {
  id: number;
  x: number;
  y: number;
  isFixed?: boolean;
  isRoller?: boolean;
}

export interface TrussMember {
  id: number;
  nodeA: number;
  nodeB: number;
  force?: number; // Positive for Tension, Negative for Compression
}