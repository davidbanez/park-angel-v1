import React, { useRef, useEffect, useCallback } from 'react';

// Temporary types until shared package is fixed
interface LayoutElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotation: number;
  properties: Record<string, any>;
  style: Record<string, any>;
}

interface Position {
  x: number;
  y: number;
}

interface CanvasState {
  selectedElements: string[];
  draggedElement?: string;
  isDrawing: boolean;
  tool: string;
  zoom: number;
  panOffset: Position;
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

interface LayoutMetadata {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  version: string;
}

interface LayoutCanvasProps {
  elements: LayoutElement[];
  canvasState: CanvasState;
  metadata: LayoutMetadata;
  occupancyOverlay: OccupancyOverlay[];
  showOccupancy: boolean;
  onElementAdd: (type: any, position: Position) => void;
  onElementSelect: (elementIds: string[]) => void;
  onElementUpdate: (elementId: string, updates: Partial<LayoutElement>) => void;
  onPan: (deltaX: number, deltaY: number) => void;
}

export const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  elements,
  canvasState,
  metadata,
  occupancyOverlay,
  showOccupancy,
  onElementAdd,
  onElementSelect,
  onElementUpdate,
  onPan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const draggedElement = useRef<string | null>(null);

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(canvasState.zoom, canvasState.zoom);
    ctx.translate(canvasState.panOffset.x, canvasState.panOffset.y);

    // Draw grid if enabled
    if (metadata.showGrid) {
      drawGrid(ctx, metadata.gridSize);
    }

    // Draw elements
    elements.forEach(element => {
      drawElement(
        ctx,
        element,
        canvasState.selectedElements.includes(element.id)
      );
    });

    // Draw occupancy overlay if enabled
    if (showOccupancy) {
      drawOccupancyOverlay(ctx, elements, occupancyOverlay);
    }

    ctx.restore();
  }, [elements, canvasState, metadata, occupancyOverlay, showOccupancy]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, gridSize: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const canvas = canvasRef.current!;
    const width = canvas.width / canvasState.zoom;
    const height = canvas.height / canvasState.zoom;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw individual element
  const drawElement = (
    ctx: CanvasRenderingContext2D,
    element: LayoutElement,
    isSelected: boolean
  ) => {
    ctx.save();

    // Apply element transformations
    ctx.translate(
      element.position.x + element.dimensions.width / 2,
      element.position.y + element.dimensions.height / 2
    );
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(
      -element.dimensions.width / 2,
      -element.dimensions.height / 2
    );

    // Draw element background
    ctx.fillStyle = element.style.backgroundColor || '#e5e7eb';
    ctx.fillRect(0, 0, element.dimensions.width, element.dimensions.height);

    // Draw element border
    ctx.strokeStyle = element.style.borderColor || '#374151';
    ctx.lineWidth = element.style.borderWidth || 1;
    ctx.setLineDash([]);
    ctx.strokeRect(0, 0, element.dimensions.width, element.dimensions.height);

    // Draw element icon/label
    drawElementContent(ctx, element);

    // Draw selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        -2,
        -2,
        element.dimensions.width + 4,
        element.dimensions.height + 4
      );

      // Draw resize handles
      drawResizeHandles(ctx, element.dimensions);
    }

    ctx.restore();
  };

  // Draw element content (icons, labels, etc.)
  const drawElementContent = (
    ctx: CanvasRenderingContext2D,
    element: LayoutElement
  ) => {
    const { width, height } = element.dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw type-specific content
    switch (element.type) {
      case 'parking-spot':
        ctx.fillText('P', centerX, centerY - 8);
        if (element.properties.spotNumber) {
          ctx.font = '10px Arial';
          ctx.fillText(element.properties.spotNumber, centerX, centerY + 8);
        }
        break;

      case 'disabled-spot':
        ctx.fillText('♿', centerX, centerY - 8);
        if (element.properties.spotNumber) {
          ctx.font = '10px Arial';
          ctx.fillText(element.properties.spotNumber, centerX, centerY + 8);
        }
        break;

      case 'motorcycle-spot':
        ctx.fillText('M', centerX, centerY - 8);
        if (element.properties.spotNumber) {
          ctx.font = '10px Arial';
          ctx.fillText(element.properties.spotNumber, centerX, centerY + 8);
        }
        break;

      case 'electric-charging':
        ctx.fillText('⚡', centerX, centerY - 8);
        if (element.properties.spotNumber) {
          ctx.font = '10px Arial';
          ctx.fillText(element.properties.spotNumber, centerX, centerY + 8);
        }
        break;

      case 'entrance':
        ctx.fillText('IN', centerX, centerY);
        break;

      case 'exit':
        ctx.fillText('OUT', centerX, centerY);
        break;

      case 'elevator':
        ctx.fillText('🛗', centerX, centerY);
        break;

      case 'stairs':
        ctx.fillText('🪜', centerX, centerY);
        break;

      case 'one-way-lane':
        drawArrow(
          ctx,
          centerX,
          centerY,
          element.properties.direction || 'north'
        );
        break;

      case 'two-way-lane':
        ctx.fillText('↕', centerX, centerY);
        break;

      default:
        if (element.properties.label) {
          ctx.fillText(element.properties.label, centerX, centerY);
        }
    }
  };

  // Draw arrow for directional elements
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: string
  ) => {
    const size = 8;
    ctx.beginPath();

    switch (direction) {
      case 'north':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size / 2, y);
        ctx.lineTo(x + size / 2, y);
        break;
      case 'south':
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size / 2, y);
        ctx.lineTo(x + size / 2, y);
        break;
      case 'east':
        ctx.moveTo(x + size, y);
        ctx.lineTo(x, y - size / 2);
        ctx.lineTo(x, y + size / 2);
        break;
      case 'west':
        ctx.moveTo(x - size, y);
        ctx.lineTo(x, y - size / 2);
        ctx.lineTo(x, y + size / 2);
        break;
    }

    ctx.closePath();
    ctx.fill();
  };

  // Draw resize handles for selected elements
  const drawResizeHandles = (
    ctx: CanvasRenderingContext2D,
    dimensions: { width: number; height: number }
  ) => {
    const handleSize = 6;
    const { width, height } = dimensions;

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Corner handles
    const handles = [
      { x: -handleSize / 2, y: -handleSize / 2 }, // Top-left
      { x: width - handleSize / 2, y: -handleSize / 2 }, // Top-right
      { x: width - handleSize / 2, y: height - handleSize / 2 }, // Bottom-right
      { x: -handleSize / 2, y: height - handleSize / 2 }, // Bottom-left
    ];

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Draw occupancy overlay
  const drawOccupancyOverlay = (
    ctx: CanvasRenderingContext2D,
    elements: LayoutElement[],
    occupancyData: OccupancyOverlay[]
  ) => {
    elements.forEach(element => {
      if (!element.type.includes('spot')) return;

      const occupancy = occupancyData.find(o => o.spotId === element.id);
      if (!occupancy) return;

      ctx.save();
      ctx.globalAlpha = 0.7;

      // Color based on occupancy status
      switch (occupancy.status) {
        case 'occupied':
          ctx.fillStyle = '#ef4444'; // Red
          break;
        case 'reserved':
          ctx.fillStyle = '#f59e0b'; // Yellow
          break;
        case 'maintenance':
          ctx.fillStyle = '#6b7280'; // Gray
          break;
        default:
          ctx.fillStyle = '#10b981'; // Green
      }

      ctx.fillRect(
        element.position.x,
        element.position.y,
        element.dimensions.width,
        element.dimensions.height
      );

      ctx.restore();
    });
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Position => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x =
        (screenX - rect.left - canvasState.panOffset.x) / canvasState.zoom;
      const y =
        (screenY - rect.top - canvasState.panOffset.y) / canvasState.zoom;

      return { x, y };
    },
    [canvasState.zoom, canvasState.panOffset]
  );

  // Find element at position
  const findElementAt = useCallback(
    (position: Position): string | null => {
      // Check elements in reverse order (top to bottom)
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const { x, y } = element.position;
        const { width, height } = element.dimensions;

        if (
          position.x >= x &&
          position.x <= x + width &&
          position.y >= y &&
          position.y <= y + height
        ) {
          return element.id;
        }
      }

      return null;
    },
    [elements]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToCanvas(event.clientX, event.clientY);

      if (canvasState.tool === 'pan') {
        isDragging.current = true;
        dragStart.current = { x: event.clientX, y: event.clientY };
        return;
      }

      if (canvasState.tool === 'select') {
        const elementId = findElementAt(position);

        if (elementId) {
          // Select element and prepare for dragging
          onElementSelect([elementId]);
          isDragging.current = true;
          draggedElement.current = elementId;
          dragStart.current = position;
        } else {
          // Clear selection
          onElementSelect([]);
        }
        return;
      }

      // Drawing mode - add new element
      if (canvasState.tool !== 'select' && canvasState.tool !== 'pan') {
        onElementAdd(canvasState.tool, position);
      }
    },
    [
      canvasState.tool,
      screenToCanvas,
      findElementAt,
      onElementSelect,
      onElementAdd,
    ]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging.current) return;

      if (canvasState.tool === 'pan') {
        const deltaX = event.clientX - dragStart.current.x;
        const deltaY = event.clientY - dragStart.current.y;
        onPan(deltaX, deltaY);
        dragStart.current = { x: event.clientX, y: event.clientY };
        return;
      }

      if (draggedElement.current) {
        const currentPosition = screenToCanvas(event.clientX, event.clientY);
        const deltaX = currentPosition.x - dragStart.current.x;
        const deltaY = currentPosition.y - dragStart.current.y;

        onElementUpdate(draggedElement.current, {
          position: {
            x: currentPosition.x - deltaX,
            y: currentPosition.y - deltaY,
          },
        });
      }
    },
    [canvasState.tool, screenToCanvas, onPan, onElementUpdate]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    draggedElement.current = null;
  }, []);

  // Redraw canvas when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Set up canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className='flex-1 relative overflow-hidden bg-gray-50'
      style={{ cursor: canvasState.tool === 'pan' ? 'grab' : 'crosshair' }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className='absolute inset-0'
      />

      {/* Canvas overlay info */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-sm'>
        <div>Zoom: {Math.round(canvasState.zoom * 100)}%</div>
        <div>Tool: {canvasState.tool}</div>
        <div>Elements: {elements.length}</div>
      </div>
    </div>
  );
};
