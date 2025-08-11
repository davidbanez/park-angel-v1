import React from 'react';
import { Button } from '../shared/Button';

interface LayoutToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  showOccupancy: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSave: () => void;
  onExport: () => void;
  onToggleOccupancy: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  canUndo,
  canRedo,
  showOccupancy,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSave,
  onExport,
  onToggleOccupancy,
  onToggleGrid,
  showGrid,
}) => {
  return (
    <div className='flex items-center justify-between p-4 bg-white border-b border-gray-200'>
      {/* Left side - History and View controls */}
      <div className='flex items-center space-x-2'>
        <div className='flex items-center space-x-1 border-r border-gray-200 pr-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={onUndo}
            disabled={!canUndo}
            title='Undo (Ctrl+Z)'
          >
            ↶
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onRedo}
            disabled={!canRedo}
            title='Redo (Ctrl+Y)'
          >
            ↷
          </Button>
        </div>

        <div className='flex items-center space-x-1 border-r border-gray-200 pr-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={onZoomOut}
            title='Zoom Out (-)'
          >
            🔍-
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onResetZoom}
            title='Reset Zoom (0)'
          >
            100%
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={onZoomIn}
            title='Zoom In (+)'
          >
            🔍+
          </Button>
        </div>

        <div className='flex items-center space-x-1'>
          <Button
            variant={showGrid ? 'primary' : 'outline'}
            size='sm'
            onClick={onToggleGrid}
            title='Toggle Grid (G)'
          >
            ⊞
          </Button>
          <Button
            variant={showOccupancy ? 'primary' : 'outline'}
            size='sm'
            onClick={onToggleOccupancy}
            title='Toggle Occupancy Overlay'
          >
            👁️
          </Button>
        </div>
      </div>

      {/* Center - Layout name */}
      <div className='flex-1 text-center'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Facility Layout Designer
        </h2>
      </div>

      {/* Right side - Actions */}
      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onExport}
          title='Export Layout'
        >
          📤 Export
        </Button>
        <Button
          variant='primary'
          size='sm'
          onClick={onSave}
          title='Save Layout (Ctrl+S)'
        >
          💾 Save
        </Button>
      </div>
    </div>
  );
};
