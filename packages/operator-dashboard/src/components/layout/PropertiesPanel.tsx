import React from 'react';
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
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';

interface PropertiesPanelProps {
  selectedElements: LayoutElement[];
  onElementUpdate: (elementId: string, updates: Partial<LayoutElement>) => void;
  onElementDelete: (elementId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  onElementUpdate,
  onElementDelete,
}) => {
  if (selectedElements.length === 0) {
    return (
      <div className='w-64 bg-white border-l border-gray-200 p-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Properties</h3>
        <p className='text-gray-500 text-sm'>
          Select an element to edit its properties.
        </p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className='w-64 bg-white border-l border-gray-200 p-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Properties</h3>
        <p className='text-gray-500 text-sm mb-4'>
          {selectedElements.length} elements selected
        </p>
        <Button
          variant='outline'
          size='sm'
          onClick={() => selectedElements.forEach(el => onElementDelete(el.id))}
          className='w-full text-red-600 border-red-300 hover:bg-red-50'
        >
          Delete Selected
        </Button>
      </div>
    );
  }

  const element = selectedElements[0];

  const updateProperty = (key: string, value: any) => {
    onElementUpdate(element.id, {
      properties: { ...element.properties, [key]: value },
    });
  };

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    onElementUpdate(element.id, {
      position: { ...element.position, [axis]: value },
    });
  };

  const updateDimensions = (dimension: 'width' | 'height', value: number) => {
    onElementUpdate(element.id, {
      dimensions: { ...element.dimensions, [dimension]: value },
    });
  };

  const updateRotation = (rotation: number) => {
    onElementUpdate(element.id, { rotation });
  };

  const updateStyle = (key: string, value: any) => {
    onElementUpdate(element.id, {
      style: { ...element.style, [key]: value },
    });
  };

  return (
    <div className='w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Properties</h3>

      {/* Element Type */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Type
        </label>
        <div className='text-sm text-gray-600 bg-gray-50 p-2 rounded'>
          {element.type
            .replace('-', ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </div>
      </div>

      {/* Position */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Position
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>X</label>
            <Input
              type='number'
              value={Math.round(element.position.x).toString()}
              onChange={e => updatePosition('x', parseInt(e.target.value) || 0)}
              size='sm'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Y</label>
            <Input
              type='number'
              value={Math.round(element.position.y).toString()}
              onChange={e => updatePosition('y', parseInt(e.target.value) || 0)}
              size='sm'
            />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Size
        </label>
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Width</label>
            <Input
              type='number'
              value={Math.round(element.dimensions.width).toString()}
              onChange={e =>
                updateDimensions('width', parseInt(e.target.value) || 1)
              }
              size='sm'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Height</label>
            <Input
              type='number'
              value={Math.round(element.dimensions.height).toString()}
              onChange={e =>
                updateDimensions('height', parseInt(e.target.value) || 1)
              }
              size='sm'
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Rotation (degrees)
        </label>
        <Input
          type='number'
          value={element.rotation.toString()}
          onChange={e => updateRotation(parseInt(e.target.value) || 0)}
          min='0'
          max='360'
          size='sm'
        />
      </div>

      {/* Element-specific properties */}
      {(element.type.includes('spot') ||
        element.type === 'electric-charging') && (
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Spot Number
          </label>
          <Input
            type='text'
            value={element.properties.spotNumber || ''}
            onChange={e => updateProperty('spotNumber', e.target.value)}
            placeholder='e.g., A-01'
            size='sm'
          />
        </div>
      )}

      {(element.type === 'entrance' ||
        element.type === 'exit' ||
        element.type === 'one-way-lane') && (
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Direction
          </label>
          <select
            value={element.properties.direction || 'north'}
            onChange={e => updateProperty('direction', e.target.value)}
            className='w-full px-3 py-1 border border-gray-300 rounded-md text-sm'
          >
            <option value='north'>North ↑</option>
            <option value='south'>South ↓</option>
            <option value='east'>East →</option>
            <option value='west'>West ←</option>
          </select>
        </div>
      )}

      {element.type === 'elevator' && (
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Capacity
          </label>
          <Input
            type='number'
            value={(element.properties.capacity || 8).toString()}
            onChange={e =>
              updateProperty('capacity', parseInt(e.target.value) || 8)
            }
            min='1'
            max='20'
            size='sm'
          />
        </div>
      )}

      {element.properties.label !== undefined && (
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Label
          </label>
          <Input
            type='text'
            value={element.properties.label || ''}
            onChange={e => updateProperty('label', e.target.value)}
            placeholder='Custom label'
            size='sm'
          />
        </div>
      )}

      {/* Style Properties */}
      <div className='mb-4'>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Appearance
        </label>

        <div className='space-y-2'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>
              Background Color
            </label>
            <input
              type='color'
              value={element.style.backgroundColor || '#e5e7eb'}
              onChange={e => updateStyle('backgroundColor', e.target.value)}
              className='w-full h-8 border border-gray-300 rounded cursor-pointer'
            />
          </div>

          <div>
            <label className='block text-xs text-gray-500 mb-1'>
              Border Color
            </label>
            <input
              type='color'
              value={element.style.borderColor || '#374151'}
              onChange={e => updateStyle('borderColor', e.target.value)}
              className='w-full h-8 border border-gray-300 rounded cursor-pointer'
            />
          </div>

          <div>
            <label className='block text-xs text-gray-500 mb-1'>
              Border Width
            </label>
            <Input
              type='number'
              value={(element.style.borderWidth || 1).toString()}
              onChange={e =>
                updateStyle('borderWidth', parseInt(e.target.value) || 1)
              }
              min='0'
              max='10'
              size='sm'
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='pt-4 border-t border-gray-200'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onElementDelete(element.id)}
          className='w-full text-red-600 border-red-300 hover:bg-red-50'
        >
          Delete Element
        </Button>
      </div>
    </div>
  );
};
