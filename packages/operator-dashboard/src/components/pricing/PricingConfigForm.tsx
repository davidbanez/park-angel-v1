import React, { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card } from '../shared/Card';
import { PricingHierarchyNode, HierarchicalPricingService } from '../../../../shared/src/services/hierarchical-pricing';
import { CreatePricingConfigData, CreateVehicleTypeRateData, CreateTimeBasedRateData, CreateHolidayRateData } from '../../../../shared/src/models/pricing';
import { VehicleType } from '../../../../shared/src/types';
import { createClient } from '@supabase/supabase-js';

interface PricingConfigFormProps {
  node: PricingHierarchyNode;
  onSave: () => void;
  onCancel: () => void;
}

export const PricingConfigForm: React.FC<PricingConfigFormProps> = ({
  node,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreatePricingConfigData>({
    baseRate: 50,
    vatRate: 12,
    occupancyMultiplier: 1.0,
    vehicleTypeRates: [],
    timeBasedRates: [],
    holidayRates: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'vehicles' | 'time' | 'holidays'>('basic');

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );
  const pricingService = new HierarchicalPricingService(supabase);

  useEffect(() => {
    if (node.pricingConfig) {
      setFormData({
        baseRate: node.pricingConfig.baseRate.value,
        vatRate: node.pricingConfig.vatRate.value,
        occupancyMultiplier: node.pricingConfig.occupancyMultiplier,
        vehicleTypeRates: node.pricingConfig.vehicleTypeRates.map(vtr => ({
          vehicleType: vtr.vehicleType,
          rate: vtr.rate.value
        })),
        timeBasedRates: node.pricingConfig.timeBasedRates.map(tbr => ({
          dayOfWeek: tbr.dayOfWeek,
          startTime: tbr.getStartTime(),
          endTime: tbr.getEndTime(),
          multiplier: tbr.multiplier,
          name: tbr.name
        })),
        holidayRates: node.pricingConfig.holidayRates.map(hr => ({
          name: hr.name,
          date: hr.date,
          multiplier: hr.multiplier,
          isRecurring: hr.isRecurring
        }))
      });
    }
  }, [node]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await pricingService.updatePricing({
        hierarchyLevel: node.level,
        id: node.id,
        pricingConfig: formData
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const addVehicleTypeRate = () => {
    setFormData(prev => ({
      ...prev,
      vehicleTypeRates: [
        ...prev.vehicleTypeRates || [],
        { vehicleType: 'car' as VehicleType, rate: formData.baseRate }
      ]
    }));
  };

  const updateVehicleTypeRate = (index: number, updates: Partial<CreateVehicleTypeRateData>) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypeRates: prev.vehicleTypeRates?.map((vtr, i) => 
        i === index ? { ...vtr, ...updates } : vtr
      ) || []
    }));
  };

  const removeVehicleTypeRate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypeRates: prev.vehicleTypeRates?.filter((_, i) => i !== index) || []
    }));
  };

  const addTimeBasedRate = () => {
    setFormData(prev => ({
      ...prev,
      timeBasedRates: [
        ...prev.timeBasedRates || [],
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          multiplier: 1.2,
          name: 'Business Hours'
        }
      ]
    }));
  };

  const updateTimeBasedRate = (index: number, updates: Partial<CreateTimeBasedRateData>) => {
    setFormData(prev => ({
      ...prev,
      timeBasedRates: prev.timeBasedRates?.map((tbr, i) => 
        i === index ? { ...tbr, ...updates } : tbr
      ) || []
    }));
  };

  const removeTimeBasedRate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeBasedRates: prev.timeBasedRates?.filter((_, i) => i !== index) || []
    }));
  };

  const addHolidayRate = () => {
    setFormData(prev => ({
      ...prev,
      holidayRates: [
        ...prev.holidayRates || [],
        {
          name: 'Holiday',
          date: new Date(),
          multiplier: 1.5,
          isRecurring: false
        }
      ]
    }));
  };

  const updateHolidayRate = (index: number, updates: Partial<CreateHolidayRateData>) => {
    setFormData(prev => ({
      ...prev,
      holidayRates: prev.holidayRates?.map((hr, i) => 
        i === index ? { ...hr, ...updates } : hr
      ) || []
    }));
  };

  const removeHolidayRate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      holidayRates: prev.holidayRates?.filter((_, i) => i !== index) || []
    }));
  };

  const vehicleTypes: VehicleType[] = ['car', 'motorcycle', 'truck', 'van', 'suv'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'basic', label: 'Basic Pricing' },
            { key: 'vehicles', label: 'Vehicle Types' },
            { key: 'time', label: 'Time-based Rules' },
            { key: 'holidays', label: 'Holiday Rules' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Pricing Tab */}
      {activeTab === 'basic' && (
        <Card>
          <div className="p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Basic Pricing Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Rate (₱/hour)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.vatRate || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupancy Multiplier
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={formData.occupancyMultiplier || 1.0}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupancyMultiplier: parseFloat(e.target.value) || 1.0 }))}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Dynamic Pricing Rules</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 90%+ occupancy: 1.5x multiplier (50% increase)</li>
                <li>• 75-89% occupancy: 1.25x multiplier (25% increase)</li>
                <li>• 50-74% occupancy: 1.1x multiplier (10% increase)</li>
                <li>• 26-49% occupancy: No adjustment</li>
                <li>• ≤25% occupancy: 0.9x multiplier (10% discount)</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Vehicle Types Tab */}
      {activeTab === 'vehicles' && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Vehicle Type Pricing</h4>
              <Button type="button" onClick={addVehicleTypeRate} variant="outline">
                Add Vehicle Type
              </Button>
            </div>

            {formData.vehicleTypeRates && formData.vehicleTypeRates.length > 0 ? (
              <div className="space-y-3">
                {formData.vehicleTypeRates.map((vtr, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={vtr.vehicleType}
                        onChange={(e) => updateVehicleTypeRate(index, { vehicleType: e.target.value as VehicleType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {vehicleTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Rate (₱/hour)"
                        value={vtr.rate}
                        onChange={(e) => updateVehicleTypeRate(index, { rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeVehicleTypeRate(index)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No vehicle type rates configured. Base rate will be used for all vehicle types.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Time-based Rules Tab */}
      {activeTab === 'time' && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Time-based Pricing Rules</h4>
              <Button type="button" onClick={addTimeBasedRate} variant="outline">
                Add Time Rule
              </Button>
            </div>

            {formData.timeBasedRates && formData.timeBasedRates.length > 0 ? (
              <div className="space-y-3">
                {formData.timeBasedRates.map((tbr, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <Input
                          value={tbr.name}
                          onChange={(e) => updateTimeBasedRate(index, { name: e.target.value })}
                          placeholder="Rule name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                        <select
                          value={tbr.dayOfWeek}
                          onChange={(e) => updateTimeBasedRate(index, { dayOfWeek: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {dayNames.map((day, dayIndex) => (
                            <option key={dayIndex} value={dayIndex}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                        <Input
                          type="time"
                          value={tbr.startTime}
                          onChange={(e) => updateTimeBasedRate(index, { startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                        <Input
                          type="time"
                          value={tbr.endTime}
                          onChange={(e) => updateTimeBasedRate(index, { endTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Multiplier</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            value={tbr.multiplier}
                            onChange={(e) => updateTimeBasedRate(index, { multiplier: parseFloat(e.target.value) || 1.0 })}
                          />
                          <Button
                            type="button"
                            onClick={() => removeTimeBasedRate(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No time-based rules configured. Base rate will be used for all times.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Holiday Rules Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Holiday Pricing Rules</h4>
              <Button type="button" onClick={addHolidayRate} variant="outline">
                Add Holiday Rule
              </Button>
            </div>

            {formData.holidayRates && formData.holidayRates.length > 0 ? (
              <div className="space-y-3">
                {formData.holidayRates.map((hr, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label>
                        <Input
                          value={hr.name}
                          onChange={(e) => updateHolidayRate(index, { name: e.target.value })}
                          placeholder="Holiday name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <Input
                          type="date"
                          value={hr.date instanceof Date ? hr.date.toISOString().split('T')[0] : ''}
                          onChange={(e) => updateHolidayRate(index, { date: new Date(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Multiplier</label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="5.0"
                          value={hr.multiplier}
                          onChange={(e) => updateHolidayRate(index, { multiplier: parseFloat(e.target.value) || 1.0 })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={hr.isRecurring}
                            onChange={(e) => updateHolidayRate(index, { isRecurring: e.target.checked })}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">Recurring</span>
                        </label>
                        <Button
                          type="button"
                          onClick={() => removeHolidayRate(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No holiday rules configured. Base rate will be used for all dates.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Pricing Configuration'}
        </Button>
      </div>
    </form>
  );
};