import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { PricingHierarchyNode, PricingInheritanceResult } from '../../../../shared/src/services/hierarchical-pricing';
import { PricingConfig } from '../../../../shared/src/models/pricing';
// import { createClient } from '@supabase/supabase-js';

interface PricingInheritanceViewerProps {
  node: PricingHierarchyNode;
  onClose: () => void;
}

export const PricingInheritanceViewer: React.FC<PricingInheritanceViewerProps> = ({
  node,
  onClose
}) => {
  const [inheritanceResult, setInheritanceResult] = useState<PricingInheritanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInheritanceDetails();
  }, [node]);

  const loadInheritanceDetails = async () => {
    try {
      setLoading(true);
      // Mock inheritance result for demo
      const mockResult: PricingInheritanceResult = {
        level: node.level,
        id: node.id,
        name: node.name,
        effectivePricing: {
          baseRate: { value: 50 },
          vatRate: { value: 12 },
          occupancyMultiplier: 1.0,
          vehicleTypeRates: [],
          timeBasedRates: [],
          holidayRates: []
        } as any,
        source: 'default'
      };
      setInheritanceResult(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing details');
    } finally {
      setLoading(false);
    }
  };

  const renderPricingDetails = (pricing: PricingConfig, title: string, variant: 'own' | 'inherited' | 'default') => {
    const colorClasses = {
      own: 'border-green-200 bg-green-50',
      inherited: 'border-blue-200 bg-blue-50',
      default: 'border-gray-200 bg-gray-50'
    };

    const badgeClasses = {
      own: 'bg-green-100 text-green-800',
      inherited: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };

    return (
      <div className={`p-4 border rounded-lg ${colorClasses[variant]}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className={`px-2 py-1 text-xs font-medium rounded ${badgeClasses[variant]}`}>
            {variant === 'own' ? 'Own Configuration' : variant === 'inherited' ? 'Inherited' : 'Default'}
          </span>
        </div>

        <div className="space-y-3">
          {/* Basic Pricing */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Basic Pricing</h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Base Rate:</span>
                <span className="ml-2 font-medium">₱{pricing.baseRate.value}/hour</span>
              </div>
              <div>
                <span className="text-gray-600">VAT Rate:</span>
                <span className="ml-2 font-medium">{pricing.vatRate.value}%</span>
              </div>
              <div>
                <span className="text-gray-600">Occupancy Multiplier:</span>
                <span className="ml-2 font-medium">{pricing.occupancyMultiplier}x</span>
              </div>
            </div>
          </div>

          {/* Vehicle Type Rates */}
          {pricing.vehicleTypeRates.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Vehicle Type Rates</h5>
              <div className="space-y-1">
                {pricing.vehicleTypeRates.map((vtr, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{vtr.vehicleType}:</span>
                    <span className="font-medium">₱{vtr.rate.value}/hour</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time-based Rates */}
          {pricing.timeBasedRates.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Time-based Rules</h5>
              <div className="space-y-1">
                {pricing.timeBasedRates.map((tbr, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{tbr.name}:</span>
                      <span className="font-medium">{tbr.multiplier}x</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {tbr.getDayName()}, {tbr.getStartTime()} - {tbr.getEndTime()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holiday Rates */}
          {pricing.holidayRates.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Holiday Rules</h5>
              <div className="space-y-1">
                {pricing.holidayRates.map((hr, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">{hr.name}:</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {hr.date.toLocaleDateString()} {hr.isRecurring ? '(Recurring)' : ''}
                      </span>
                    </div>
                    <span className="font-medium">{hr.multiplier}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading pricing details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Details</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadInheritanceDetails}>Try Again</Button>
      </div>
    );
  }

  if (!inheritanceResult) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Pricing Details - {inheritanceResult.name}
        </h3>
        <p className="text-gray-600 capitalize">
          {inheritanceResult.level} • Source: {inheritanceResult.source}
        </p>
      </div>

      {/* Effective Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Effective Pricing</h3>
        {renderPricingDetails(
          inheritanceResult.effectivePricing,
          'Currently Applied Pricing',
          inheritanceResult.source
        )}
      </div>

      {/* Own Pricing (if different from effective) */}
      {inheritanceResult.ownPricing && inheritanceResult.source !== 'own' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Own Configuration</h3>
          {renderPricingDetails(
            inheritanceResult.ownPricing,
            'This Node\'s Pricing Configuration',
            'own'
          )}
        </div>
      )}

      {/* Inherited Pricing (if applicable) */}
      {inheritanceResult.inheritedPricing && inheritanceResult.source === 'inherited' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Inherited Configuration</h3>
          {renderPricingDetails(
            inheritanceResult.inheritedPricing,
            'Inherited from Parent',
            'inherited'
          )}
        </div>
      )}

      {/* Pricing Calculation Example */}
      <Card>
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Pricing Calculation Example</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Rate (1 hour):</span>
                <span>₱{inheritanceResult.effectivePricing.baseRate.value}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({inheritanceResult.effectivePricing.vatRate.value}%):</span>
                <span>₱{(inheritanceResult.effectivePricing.baseRate.value * inheritanceResult.effectivePricing.vatRate.value / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                <span>Total (1 hour):</span>
                <span>₱{(inheritanceResult.effectivePricing.baseRate.value * (1 + inheritanceResult.effectivePricing.vatRate.value / 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Actual pricing may vary based on vehicle type, time of day, occupancy, and holiday rules.
          </p>
        </div>
      </Card>

      {/* Inheritance Chain */}
      <Card>
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Pricing Inheritance Chain</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Own pricing configuration (highest priority)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Inherited from parent levels</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>System default pricing (lowest priority)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            The system uses the most specific pricing configuration available. 
            Spot-level pricing overrides zone-level, which overrides section-level, which overrides location-level.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};