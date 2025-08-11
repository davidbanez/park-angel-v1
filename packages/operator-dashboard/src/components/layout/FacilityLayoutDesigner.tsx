import React, { useCallback, useEffect } from 'react';
// Temporary types until shared package is fixed
interface FacilityLayout {
  id: string;
  locationId: string;
  name: string;
  elements: LayoutElement[];
  metadata: {
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    gridSize: number;
    showGrid: boolean;
    snapToGrid: boolean;
    version: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  rotation: number;
  properties: Record<string, any>;
  style: Record<string, any>;
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
import { useFacilityLayout } from '../../hooks/useFacilityLayout';
import { DrawingToolsPalette } from './DrawingToolsPalette';
import { LayoutCanvas } from './LayoutCanvas';
import { LayoutToolbar } from './LayoutToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';

interface FacilityLayoutDesignerProps {
  locationId: string;
  initialLayout?: FacilityLayout;
  occupancyData?: OccupancyOverlay[];
  onSave?: (layout: FacilityLayout) => Promise<void>;
  onClose?: () => void;
}

export const FacilityLayoutDesigner: React.FC<FacilityLayoutDesignerProps> = ({
  initialLayout,
  occupancyData = [],
  onSave,
  onClose,
}) => {
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<
    'png' | 'jpg' | 'svg' | 'pdf'
  >('png');
  const [exportOptions, setExportOptions] = React.useState({
    includeOccupancy: true,
    includeLabels: true,
    quality: 90,
    backgroundColor: '#ffffff',
  });

  const {
    layout,
    canvasState,
    occupancyOverlay,
    showOccupancy,
    canvasRef,
    addElement,
    updateElement,
    deleteElement,
    selectElements,
    setTool,
    zoomIn,
    zoomOut,
    resetZoom,
    pan,
    undo,
    redo,
    canUndo,
    canRedo,
    saveLayout,
    toggleOccupancyOverlay,
    updateOccupancyData,
  } = useFacilityLayout({
    initialLayout,
    onSave,
    onExport: handleExport,
  });

  // Update occupancy data when prop changes
  useEffect(() => {
    updateOccupancyData(occupancyData);
  }, [occupancyData, updateOccupancyData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case '=':
          case '+':
            event.preventDefault();
            zoomIn();
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
          case '0':
            event.preventDefault();
            resetZoom();
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (canvasState.selectedElements.length > 0) {
              event.preventDefault();
              canvasState.selectedElements.forEach(deleteElement);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setTool('select');
            selectElements([]);
            break;
          case 'g':
            event.preventDefault();
            toggleGrid();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canvasState.selectedElements,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    deleteElement,
    setTool,
    selectElements,
  ]);

  const handleSave = useCallback(async () => {
    try {
      await saveLayout();
      // Show success message or notification
    } catch (error) {
      console.error('Failed to save layout:', error);
      // Show error message
    }
  }, [saveLayout]);

  async function handleExport(format: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      let dataUrl: string;

      switch (format) {
        case 'png':
          dataUrl = canvas.toDataURL('image/png');
          break;
        case 'jpg':
          dataUrl = canvas.toDataURL('image/jpeg', exportOptions.quality / 100);
          break;
        case 'svg':
          // For SVG, we'd need to recreate the drawing using SVG elements
          // This is a simplified version - in production, you'd want a proper SVG export
          dataUrl = canvas.toDataURL('image/png');
          break;
        case 'pdf':
          // For PDF, you'd typically use a library like jsPDF
          dataUrl = canvas.toDataURL('image/png');
          break;
        default:
          dataUrl = canvas.toDataURL('image/png');
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `facility-layout-${Date.now()}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export layout:', error);
    }
  }

  const toggleGrid = useCallback(() => {
    // This would update the layout metadata to toggle grid visibility
    // For now, we'll just implement the UI part
  }, []);

  const selectedElements = layout.elements.filter((el: any) =>
    canvasState.selectedElements.includes(el.id)
  );

  return (
    <div className='h-screen flex flex-col bg-gray-100'>
      {/* Toolbar */}
      <LayoutToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        showOccupancy={showOccupancy}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onSave={handleSave}
        onExport={() => setShowExportModal(true)}
        onToggleOccupancy={toggleOccupancyOverlay}
        onToggleGrid={toggleGrid}
        showGrid={layout.metadata.showGrid}
      />

      {/* Main content */}
      <div className='flex-1 flex'>
        {/* Drawing tools palette */}
        <DrawingToolsPalette
          selectedTool={canvasState.tool}
          onToolSelect={setTool}
        />

        {/* Canvas */}
        <LayoutCanvas
          elements={layout.elements}
          canvasState={canvasState}
          metadata={layout.metadata}
          occupancyOverlay={occupancyOverlay}
          showOccupancy={showOccupancy}
          onElementAdd={addElement}
          onElementSelect={selectElements}
          onElementUpdate={updateElement}
          onPan={pan}
        />

        {/* Properties panel */}
        <PropertiesPanel
          selectedElements={selectedElements}
          onElementUpdate={updateElement}
          onElementDelete={deleteElement}
        />
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title='Export Layout'
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Format
            </label>
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as any)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
            >
              <option value='png'>PNG (Recommended)</option>
              <option value='jpg'>JPEG</option>
              <option value='svg'>SVG (Vector)</option>
              <option value='pdf'>PDF</option>
            </select>
          </div>

          {exportFormat === 'jpg' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Quality ({exportOptions.quality}%)
              </label>
              <input
                type='range'
                min='10'
                max='100'
                value={exportOptions.quality}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    quality: parseInt(e.target.value),
                  }))
                }
                className='w-full'
              />
            </div>
          )}

          <div className='space-y-2'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={exportOptions.includeOccupancy}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    includeOccupancy: e.target.checked,
                  }))
                }
                className='mr-2'
              />
              Include occupancy overlay
            </label>

            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={exportOptions.includeLabels}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    includeLabels: e.target.checked,
                  }))
                }
                className='mr-2'
              />
              Include labels and text
            </label>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Background Color
            </label>
            <input
              type='color'
              value={exportOptions.backgroundColor}
              onChange={e =>
                setExportOptions(prev => ({
                  ...prev,
                  backgroundColor: e.target.value,
                }))
              }
              className='w-full h-10 border border-gray-300 rounded cursor-pointer'
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button variant='outline' onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={() => handleExport(exportFormat)}
            >
              Export
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 z-10'
          title='Close Designer'
        >
          ✕
        </button>
      )}
    </div>
  );
};
