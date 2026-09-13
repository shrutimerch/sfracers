import type * as T from 'three';
import type { TrafficNode } from '../traffic-controls';
import type { Building, FacadeKind } from '../building-geometry';
export type Point = number[];
export type MapData = {
  trafficControls?: TrafficNode[];
  course?: {
    landmarks?: { name: string; address: string; position: Point; height: number }[];
    name: string;
    length: number;
    sections: { name: string; start: number; length: number }[];
  };
  paths?: { name: string; points: Point[]; width: number }[];
  roads: { name: string; points: Point[]; width?: number }[];
  route: Point[];
  buildings: Building[];
  coast?: Point[][];
  parks?: Point[][];
  parkDetails?: {
    trees: Point[];
    paths: { id: number; points: Point[]; crossing: boolean; sidewalk: boolean }[];
  };
};
export type HUD = {
  mode: string;
  lap: number;
  speed: number;
  time: number;
  boost: number;
  progress: number;
  street: string;
  position: number;
  count: number;
  drift: boolean;
  camera: string;
  scenery?: string;
  sceneryError?: string;
  credits?: string;
};
export type Facades = Record<FacadeKind, T.Texture>;
