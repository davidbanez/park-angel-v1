import React from 'react';
// Temporary types until shared package is fixed
type LayoutElementType =
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

interface DrawingTool {
  type: LayoutElementType;
  name: string;
  icon: string;
  defaultDimensions: { width: number; height: number };
  defaultProperties: Record<string, any>;
  category: 'parking' | 'navigation' | 'infrastructure' | 'accessibility';
}

interface DrawingToolsPaletteProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

const DRAWING_TOOLS: DrawingTool[] = [
  // Parking Tools
  {
    type: 'parking-spot',
    name: 'Parking Spot',
    icon: '🅿️',
    defaultDimensions: { width: 60, height: 120 },
    defaultProperties: { vehicleType: 'car' },
    category: 'parking',
  },
  {
    type: 'disabled-spot',
    name: 'Disabled Spot',
    icon: '♿',
    defaultDimensions: { width: 80, height: 120 },
    defaultProperties: { vehicleType: 'disabled', isAccessible: true },
    category: 'accessibility',
  },
  {
    type: 'motorcycle-spot',
    name: 'Motorcycle Spot',
    icon: '🏍️',
    defaultDimensions: { width: 40, height: 80 },
    defaultProperties: { vehicleType: 'motorcycle' },
    category: 'parking',
  },
  {
    type: 'electric-charging',
    name: 'EV Charging',
    icon: '🔌',
    defaultDimensions: { width: 60, height: 120 },
    defaultProperties: { vehicleType: 'car', hasCharging: true },
    category: 'parking',
  },

  // Navigation Tools
  {
    type: 'entrance',
    name: 'Entrance',
    icon: '🚪',
    defaultDimensions: { width: 100, height: 20 },
    defaultProperties: { direction: 'north' },
    category: 'navigation',
  },
  {
    type: 'exit',
    name: 'Exit',
    icon: '🚪',
    defaultDimensions: { width: 100, height: 20 },
    defaultProperties: { direction: 'south' },
    category: 'navigation',
  },
  {
    type: 'two-way-lane',
    name: 'Two-Way Lane',
    icon: '↕️',
    defaultDimensions: { width: 200, height: 40 },
    defaultProperties: {},
    category: 'navigation',
  },
  {
    type: 'one-way-lane',
    name: 'One-Way Lane',
    icon: '⬆️',
    defaultDimensions: { width: 200, height: 30 },
    defaultProperties: { direction: 'north' },
    category: 'navigation',
  },
  {
    type: 'pedestrian-walkway',
    name: 'Walkway',
    icon: '🚶',
    defaultDimensions: { width: 100, height: 30 },
    defaultProperties: {},
    category: 'navigation',
  },

  // Infrastructure Tools
  {
    type: 'elevator',
    name: 'Elevator',
    icon: '🛗',
    defaultDimensions: { width: 80, height: 80 },
    defaultProperties: { capacity: 8 },
    category: 'infrastructure',
  },
  {
    type: 'stairs',
    name: 'Stairs',
    icon: '🪜',
    defaultDimensions: { width: 60, height: 100 },
    defaultProperties: { direction: 'up' },
    category: 'infrastructure',
  },
  {
    type: 'pillar',
    name: 'Pillar',
    icon: '⬜',
    defaultDimensions: { width: 40, height: 40 },
    defaultProperties: {},
    category: 'infrastructure',
  },
  {
    type: 'wall',
    name: 'Wall',
    icon: '🧱',
    defaultDimensions: { width: 200, height: 20 },
    defaultProperties: {},
    category: 'infrastructure',
  },
  {
    type: 'barrier',
    name: 'Barrier',
    icon: '🚧',
    defaultDimensions: { width: 100, height: 10 },
    defaultProperties: {},
    category: 'infrastructure',
  },
];

const TOOL_CATEGORIES = [
  { id: 'select', name: 'Select', icon: '👆' },
  { id: 'pan', name: 'Pan', icon: '✋' },
  { id: 'parking', name: 'Parking' },
  { id: 'navigation', name: 'Navigation' },
  { id: 'infrastructure', name: 'Infrastructure' },
  { id: 'accessibility', name: 'Accessibility' },
];

export const DrawingToolsPalette: React.FC<DrawingToolsPaletteProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  const [expandedCategory, setExpandedCategory] =
    React.useState<string>('parking');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? '' : categoryId);
  };

  const renderTool = (tool: DrawingTool) => (
    <button
      key={tool.type}
      onClick={() => onToolSelect(tool.type)}
      className={`
        flex flex-col items-center p-3 rounded-lg border-2 transition-all
        ${
          selectedTool === tool.type
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      title={tool.name}
    >
      <span className='text-2xl mb-1'>{tool.icon}</span>
      <span className='text-xs font-medium text-center leading-tight'>
        {tool.name}
      </span>
    </button>
  );

  const renderBasicTool = (id: string, name: string, icon: string) => (
    <button
      key={id}
      onClick={() => onToolSelect(id as any)}
      className={`
        flex flex-col items-center p-3 rounded-lg border-2 transition-all
        ${
          selectedTool === id
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
      `}
      title={name}
    >
      <span className='text-2xl mb-1'>{icon}</span>
      <span className='text-xs font-medium text-center leading-tight'>
        {name}
      </span>
    </button>
  );

  return (
    <div className='w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Drawing Tools
      </h3>

      {/* Basic Tools */}
      <div className='mb-6'>
        <h4 className='text-sm font-medium text-gray-700 mb-2'>Basic Tools</h4>
        <div className='grid grid-cols-2 gap-2'>
          {renderBasicTool('select', 'Select', '👆')}
          {renderBasicTool('pan', 'Pan', '✋')}
        </div>
      </div>

      {/* Drawing Tools by Category */}
      {TOOL_CATEGORIES.slice(2).map(category => {
        const categoryTools = DRAWING_TOOLS.filter(
          tool => tool.category === category.id
        );
        if (categoryTools.length === 0) return null;

        return (
          <div key={category.id} className='mb-4'>
            <button
              onClick={() => toggleCategory(category.id)}
              className='flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2 hover:text-gray-900'
            >
              <span>{category.name}</span>
              <span
                className={`transform transition-transform ${
                  expandedCategory === category.id ? 'rotate-90' : ''
                }`}
              >
                ▶
              </span>
            </button>

            {expandedCategory === category.id && (
              <div className='grid grid-cols-2 gap-2'>
                {categoryTools.map(renderTool)}
              </div>
            )}
          </div>
        );
      })}

      {/* Tool Info */}
      {selectedTool !== 'select' && selectedTool !== 'pan' && (
        <div className='mt-6 p-3 bg-gray-50 rounded-lg'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Tool Info</h4>
          <p className='text-xs text-gray-600'>
            Click and drag on the canvas to place a{' '}
            {selectedTool.replace('-', ' ')}.
          </p>
        </div>
      )}
    </div>
  );
};
