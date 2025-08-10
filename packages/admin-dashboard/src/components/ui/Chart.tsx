import React from 'react';

// Simple chart components using CSS and SVG
// In a real implementation, you might use Chart.js, Recharts, or similar

interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'doughnut' | 'area';
  height?: number;
  className?: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ 
  data, 
  type, 
  height = 300, 
  className = '' 
}) => {
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  const minValue = Math.min(...data.datasets.flatMap(d => d.data));
  const range = maxValue - minValue || 1;

  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 60; // Leave space for labels
    const padding = 40;

    return (
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Data lines */}
        {data.datasets.map((dataset, datasetIndex) => {
          const points = dataset.data.map((value, index) => {
            const x = padding + (index / (data.labels.length - 1)) * (width - 2 * padding);
            const y = padding + ((maxValue - value) / range) * chartHeight;
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={datasetIndex}>
              <polyline
                points={points}
                fill="none"
                stroke={dataset.borderColor || '#8b5cf6'}
                strokeWidth={dataset.borderWidth || 2}
              />
              {/* Data points */}
              {dataset.data.map((value, index) => {
                const x = padding + (index / (data.labels.length - 1)) * (width - 2 * padding);
                const y = padding + ((maxValue - value) / range) * chartHeight;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={dataset.borderColor || '#8b5cf6'}
                  />
                );
              })}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.labels.map((label, index) => {
          const x = padding + (index / (data.labels.length - 1)) * (width - 2 * padding);
          return (
            <text
              key={index}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = minValue + ratio * range;
          const y = padding + chartHeight * (1 - ratio);
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(value)}
            </text>
          );
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
    const width = 400;
    const chartHeight = height - 60;
    const padding = 40;
    const barWidth = (width - 2 * padding) / data.labels.length * 0.8;

    return (
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={width - padding}
            y2={padding + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Bars */}
        {data.datasets[0]?.data.map((value, index) => {
          const x = padding + (index / data.labels.length) * (width - 2 * padding) + 
                   (width - 2 * padding) / data.labels.length * 0.1;
          const barHeight = (value / maxValue) * chartHeight;
          const y = padding + chartHeight - barHeight;

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={Array.isArray(data.datasets[0].backgroundColor) 
                ? data.datasets[0].backgroundColor[0] || '#8b5cf6'
                : data.datasets[0].backgroundColor || '#8b5cf6'}
            />
          );
        })}

        {/* X-axis labels */}
        {data.labels.map((label, index) => {
          const x = padding + (index / data.labels.length) * (width - 2 * padding) + 
                   (width - 2 * padding) / data.labels.length * 0.5;
          return (
            <text
              key={index}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = ratio * maxValue;
          const y = padding + chartHeight * (1 - ratio);
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(value)}
            </text>
          );
        })}
      </svg>
    );
  };

  const renderDoughnutChart = () => {
    const size = Math.min(height, 300);
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;
    const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 1;

    let currentAngle = -90; // Start from top

    return (
      <div className="flex items-center space-x-4">
        <svg width={size} height={size}>
          {data.datasets[0]?.data.map((value, index) => {
            const angle = (value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            currentAngle += angle;

            const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
            const color = Array.isArray(data.datasets[0].backgroundColor) 
              ? data.datasets[0].backgroundColor[index] 
              : colors[index % colors.length];

            return (
              <path
                key={index}
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
          {/* Center hole */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.6}
            fill="white"
          />
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {data.labels.map((label, index) => {
            const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
            const color = Array.isArray(data.datasets[0]?.backgroundColor) 
              ? data.datasets[0].backgroundColor[index] 
              : colors[index % colors.length];

            return (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {data.datasets[0]?.data[index] || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
      case 'area':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className={`${className}`}>
      {renderChart()}
    </div>
  );
};

// Metric card component for displaying key metrics
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  color = 'purple'
}) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon || <span className="font-semibold">{title.charAt(0)}</span>}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <p className={`ml-2 text-sm font-medium ${changeColorClasses[changeType || 'increase']}`}>
                {changeType === 'increase' ? '+' : ''}{change}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};