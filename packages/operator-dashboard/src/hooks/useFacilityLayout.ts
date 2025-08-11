import { useState, useCallback, useRef } from 'react';

// Temporary types until shared package is fixed
interface FacilityLayout {
  id: string;
  locationId: string;
  name: string;
  elements: LayoutElement[];
  metadata: LayoutMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutElement {
  id: string;
  type: string;
  position: Position;
  dimensions: Dimensions;
  rotation: number;
  properties: ElementProperties;
  style: ElementStyle;
}

interface Position {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface ElementProperties {
  label?: string;
  spotNumber?: string;
  vehicleType?: 'car' | 'motorcycle' | 'truck' | 'van' | 'suv' | 'disabled';
  direction?: 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
  capacity?: number;
  isAccessible?: boolean;
  hasCharging?: boolean;
  [key: string]: any;
}

interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  zIndex?: number;
}

interface LayoutMetadata {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  version: string;
}

interface OccupancyOverlay {
  spotId: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  occupiedBy?: {
    vehicleId: string;
    licensePlate: string;
    startTime: Date;
    endTime?: Date;
  };
}

interface CanvasState {
  selectedElements: string[];
  draggedElement?: string;
  isDrawing: boolean;
  tool: string;
  zoom: number;
  panOffset: Position;
}

interface LayoutAction {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'rotate';
  elementId: string;
  oldState?: Partial<LayoutElement>;
  newState?: Partial<LayoutElement>;
  timestamp: Date;
}

interface LayoutHistory {
  actions: LayoutAction[];
  currentIndex: number;
  maxHistory: number;
}

export interface UseFacilityLayoutProps {
  initialLayout?: FacilityLayout;
  onSave?: (layout: FacilityLayout) => Promise<void>;
  onExport?: (format: string) => Promise<void>;
}

export const useFacilityLayout = ({
  initialLayout,
  onSave,
  onExport,
}: UseFacilityLayoutProps = {}) => {
  const [layout, setLayout] = useState<FacilityLayout>(
    initialLayout || createEmptyLayout()
  );

  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedElements: [],
    isDrawing: false,
    tool: 'select',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
  });

  const [history, setHistory] = useState<LayoutHistory>({
    actions: [],
    currentIndex: -1,
    maxHistory: 50,
  });

  const [occupancyOverlay, setOccupancyOverlay] = useState<OccupancyOverlay[]>(
    []
  );
  const [showOccupancy, setShowOccupancy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create empty layout
  function createEmptyLayout(): FacilityLayout {
    return {
      id: crypto.randomUUID(),
      locationId: '',
      name: 'New Layout',
      elements: [],
      metadata: {
        canvasWidth: 1200,
        canvasHeight: 800,
        scale: 1,
        gridSize: 20,
        showGrid: true,
        snapToGrid: true,
        version: '1.0',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Add element to layout
  const addElement = useCallback(
    (type: string, position: Position, dimensions?: Dimensions) => {
      const newElement: LayoutElement = {
        id: crypto.randomUUID(),
        type,
        position:
          canvasState.tool === 'select' ? position : snapToGrid(position),
        dimensions: dimensions || getDefaultDimensions(type),
        rotation: 0,
        properties: getDefaultProperties(type),
        style: getDefaultStyle(type),
      };

      setLayout(prev => ({
        ...prev,
        elements: [...prev.elements, newElement],
        updatedAt: new Date(),
      }));

      addToHistory({
        type: 'add',
        elementId: newElement.id,
        newState: newElement,
        timestamp: new Date(),
      });
    },
    [canvasState.tool, layout.metadata.snapToGrid, layout.metadata.gridSize]
  );

  // Update element
  const updateElement = useCallback(
    (elementId: string, updates: Partial<LayoutElement>) => {
      const oldElement = layout.elements.find(
        (el: LayoutElement) => el.id === elementId
      );
      if (!oldElement) return;

      setLayout(prev => ({
        ...prev,
        elements: prev.elements.map(el =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
        updatedAt: new Date(),
      }));

      addToHistory({
        type: 'update',
        elementId,
        oldState: oldElement,
        newState: { ...oldElement, ...updates },
        timestamp: new Date(),
      });
    },
    [layout.elements]
  );

  // Delete element
  const deleteElement = useCallback(
    (elementId: string) => {
      const element = layout.elements.find(el => el.id === elementId);
      if (!element) return;

      setLayout(prev => ({
        ...prev,
        elements: prev.elements.filter(el => el.id !== elementId),
        updatedAt: new Date(),
      }));

      addToHistory({
        type: 'delete',
        elementId,
        oldState: element,
        timestamp: new Date(),
      });
    },
    [layout.elements]
  );

  // Select elements
  const selectElements = useCallback((elementIds: string[]) => {
    setCanvasState(prev => ({
      ...prev,
      selectedElements: elementIds,
    }));
  }, []);

  // Set drawing tool
  const setTool = useCallback((tool: string) => {
    setCanvasState(prev => ({
      ...prev,
      tool,
      selectedElements: tool === 'select' ? prev.selectedElements : [],
    }));
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
    }));
  }, []);

  // Pan functions
  const pan = useCallback((deltaX: number, deltaY: number) => {
    setCanvasState(prev => ({
      ...prev,
      panOffset: {
        x: prev.panOffset.x + deltaX,
        y: prev.panOffset.y + deltaY,
      },
    }));
  }, []);

  // Snap to grid
  const snapToGrid = useCallback(
    (position: Position): Position => {
      if (!layout.metadata.snapToGrid) return position;

      const gridSize = layout.metadata.gridSize;
      return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    },
    [layout.metadata.snapToGrid, layout.metadata.gridSize]
  );

  // History management
  const addToHistory = useCallback((action: LayoutAction) => {
    setHistory(prev => {
      const newActions = prev.actions.slice(0, prev.currentIndex + 1);
      newActions.push(action);

      if (newActions.length > prev.maxHistory) {
        newActions.shift();
      }

      return {
        ...prev,
        actions: newActions,
        currentIndex: newActions.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (history.currentIndex < 0) return;

    const action = history.actions[history.currentIndex];

    // Reverse the action
    switch (action.type) {
      case 'add':
        setLayout(prev => ({
          ...prev,
          elements: prev.elements.filter(el => el.id !== action.elementId),
        }));
        break;
      case 'delete':
        if (action.oldState) {
          setLayout(prev => ({
            ...prev,
            elements: [...prev.elements, action.oldState as LayoutElement],
          }));
        }
        break;
      case 'update':
        if (action.oldState) {
          setLayout(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
              el.id === action.elementId ? { ...el, ...action.oldState } : el
            ),
          }));
        }
        break;
    }

    setHistory(prev => ({
      ...prev,
      currentIndex: prev.currentIndex - 1,
    }));
  }, [history]);

  const redo = useCallback(() => {
    if (history.currentIndex >= history.actions.length - 1) return;

    const action = history.actions[history.currentIndex + 1];

    // Replay the action
    switch (action.type) {
      case 'add':
        if (action.newState) {
          setLayout(prev => ({
            ...prev,
            elements: [...prev.elements, action.newState as LayoutElement],
          }));
        }
        break;
      case 'delete':
        setLayout(prev => ({
          ...prev,
          elements: prev.elements.filter(el => el.id !== action.elementId),
        }));
        break;
      case 'update':
        if (action.newState) {
          setLayout(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
              el.id === action.elementId ? { ...el, ...action.newState } : el
            ),
          }));
        }
        break;
    }

    setHistory(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
    }));
  }, [history]);

  // Save layout
  const saveLayout = useCallback(async () => {
    if (onSave) {
      await onSave(layout);
    }
  }, [layout, onSave]);

  // Export layout
  const exportLayout = useCallback(
    async (format: string) => {
      if (onExport) {
        await onExport(format);
      }
    },
    [onExport]
  );

  // Toggle occupancy overlay
  const toggleOccupancyOverlay = useCallback(() => {
    setShowOccupancy(prev => !prev);
  }, []);

  // Update occupancy data
  const updateOccupancyData = useCallback((data: OccupancyOverlay[]) => {
    setOccupancyOverlay(data);
  }, []);

  return {
    // State
    layout,
    canvasState,
    history,
    occupancyOverlay,
    showOccupancy,
    canvasRef,

    // Actions
    addElement,
    updateElement,
    deleteElement,
    selectElements,
    setTool,

    // View controls
    zoomIn,
    zoomOut,
    resetZoom,
    pan,

    // History
    undo,
    redo,
    canUndo: history.currentIndex >= 0,
    canRedo: history.currentIndex < history.actions.length - 1,

    // Persistence
    saveLayout,
    exportLayout,

    // Occupancy
    toggleOccupancyOverlay,
    updateOccupancyData,

    // Utilities
    snapToGrid,
  };
};

// Helper functions
function getDefaultDimensions(type: string): Dimensions {
  const defaults: Record<string, Dimensions> = {
    'parking-spot': { width: 60, height: 120 },
    'disabled-spot': { width: 80, height: 120 },
    'motorcycle-spot': { width: 40, height: 80 },
    'electric-charging': { width: 60, height: 120 },
    entrance: { width: 100, height: 20 },
    exit: { width: 100, height: 20 },
    'two-way-lane': { width: 200, height: 40 },
    'one-way-lane': { width: 200, height: 30 },
    elevator: { width: 80, height: 80 },
    stairs: { width: 60, height: 100 },
    pillar: { width: 40, height: 40 },
    wall: { width: 200, height: 20 },
    barrier: { width: 100, height: 10 },
    'pedestrian-walkway': { width: 100, height: 30 },
  };

  return defaults[type] || { width: 50, height: 50 };
}

function getDefaultProperties(type: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    'parking-spot': { vehicleType: 'car', spotNumber: '' },
    'disabled-spot': { vehicleType: 'disabled', isAccessible: true },
    'motorcycle-spot': { vehicleType: 'motorcycle' },
    'electric-charging': { vehicleType: 'car', hasCharging: true },
    entrance: { direction: 'north' },
    exit: { direction: 'south' },
    'two-way-lane': {},
    'one-way-lane': { direction: 'north' },
    elevator: { capacity: 8 },
    stairs: { direction: 'up' },
    pillar: {},
    wall: {},
    barrier: {},
    'pedestrian-walkway': {},
  };

  return defaults[type] || {};
}

function getDefaultStyle(type: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    'parking-spot': {
      backgroundColor: '#e5e7eb',
      borderColor: '#374151',
      borderWidth: 2,
    },
    'disabled-spot': {
      backgroundColor: '#dbeafe',
      borderColor: '#2563eb',
      borderWidth: 2,
    },
    'motorcycle-spot': {
      backgroundColor: '#fef3c7',
      borderColor: '#d97706',
      borderWidth: 2,
    },
    'electric-charging': {
      backgroundColor: '#d1fae5',
      borderColor: '#059669',
      borderWidth: 2,
    },
    entrance: {
      backgroundColor: '#dcfce7',
      borderColor: '#16a34a',
      borderWidth: 2,
    },
    exit: {
      backgroundColor: '#fee2e2',
      borderColor: '#dc2626',
      borderWidth: 2,
    },
    'two-way-lane': {
      backgroundColor: '#f3f4f6',
      borderColor: '#6b7280',
      borderWidth: 1,
    },
    'one-way-lane': {
      backgroundColor: '#f9fafb',
      borderColor: '#6b7280',
      borderWidth: 1,
    },
    elevator: {
      backgroundColor: '#fef3c7',
      borderColor: '#d97706',
      borderWidth: 2,
    },
    stairs: {
      backgroundColor: '#e0e7ff',
      borderColor: '#3730a3',
      borderWidth: 2,
    },
    pillar: {
      backgroundColor: '#374151',
      borderColor: '#111827',
      borderWidth: 1,
    },
    wall: {
      backgroundColor: '#6b7280',
      borderColor: '#374151',
      borderWidth: 1,
    },
    barrier: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      borderWidth: 2,
    },
    'pedestrian-walkway': {
      backgroundColor: '#f0fdf4',
      borderColor: '#22c55e',
      borderWidth: 1,
    },
  };

  return (
    defaults[type] || {
      backgroundColor: '#e5e7eb',
      borderColor: '#374151',
      borderWidth: 1,
    }
  );
}
