// Facility Layout Designer Types

export interface FacilityLayout {
  id: string;
  locationId: string;
  name: string;
  floors: Floor[];
  elements: LayoutElement[];
  metadata: LayoutMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Floor {
  id: string;
  layoutId: string;
  name: string;
  level: number;
  elements: LayoutElement[];
}

export interface LayoutElement {
  id: string;
  type: LayoutElementType;
  position: Position;
  dimensions: Dimensions;
  rotation: number;
  properties: ElementProperties;
  style: ElementStyle;
}

export type LayoutElementType =
  | 'parking-spot'
  | 'entrance'
  | 'exit'
  | 'two-way-lane'
  | 'one-way-lane'
  | 'elevator'
  | 'stairs'
  | 'pillar'
  | 'wall'
  | 'barrier'
  | 'pedestrian-walkway'
  | 'disabled-spot'
  | 'electric-charging'
  | 'motorcycle-spot';

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ElementProperties {
  label?: string;
  spotNumber?: string;
  vehicleType?: 'car' | 'motorcycle' | 'truck' | 'van' | 'suv' | 'disabled';
  direction?: 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
  capacity?: number;
  isAccessible?: boolean;
  hasCharging?: boolean;
  [key: string]: any;
}

export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  zIndex?: number;
}

export interface LayoutMetadata {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  version: string;
}

export interface OccupancyOverlay {
  spotId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  occupiedBy?: {
    vehicleId: string;
    licensePlate: string;
    startTime: Date;
    endTime?: Date;
  };
}

export interface LayoutExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  quality: number;
  includeOccupancy: boolean;
  includeLabels: boolean;
  backgroundColor: string;
}

// Drawing tool interfaces
export interface DrawingTool {
  type: LayoutElementType;
  name: string;
  icon: string;
  defaultDimensions: Dimensions;
  defaultProperties: ElementProperties;
  category: 'parking' | 'navigation' | 'infrastructure' | 'accessibility';
}

export interface CanvasState {
  selectedElements: string[];
  draggedElement?: string;
  isDrawing: boolean;
  tool: LayoutElementType | 'select' | 'pan';
  zoom: number;
  panOffset: Position;
}

export interface LayoutAction {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'rotate';
  elementId: string;
  oldState?: Partial<LayoutElement>;
  newState?: Partial<LayoutElement>;
  timestamp: Date;
}

export interface LayoutHistory {
  actions: LayoutAction[];
  currentIndex: number;
  maxHistory: number;
}
