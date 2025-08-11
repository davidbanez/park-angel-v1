import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { HierarchicalPricingService, DiscountConfiguration } from '../../../../shared/src/services/hierarchical-pricing';
import { createClient } from '@supabase/supabase-js';

interface DiscountConfigurationManagerProps {
  operatorId: string;
}

interface DiscountFormData {
  name: string;
  type: 'senior' | 'pwd' | 'custom';
  percentage: number;
  isVATExempt: boolean;
  conditions: Record<string, any>;
  isActive: boolean;
}

export const DiscountConfigurationManager: React.FC<DiscountConfigurationManagerProps> = ({
  operatorId
}) => {
  const [discounts, setDiscounts] = useState<DiscountConfiguration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>({
    name: '',
    type: 'custom',
    percentage: 0,
    isVATExempt: false,
    conditions: {},
    isActive: true
  });

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );
  const pricingService = new HierarchicalPricingService(supabase);

  useEffect(() => {
    loadDiscounts();
  }, [operatorId]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const discountConfigs = await pricingService.getDiscountConfigurations(operatorId);
      setDiscounts(discountConfigs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discount configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = () => {
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'custom',
      percentage: 0,
      isVATExempt: false,
      conditions: {},
      isActive: true
    });
    setShowForm(true);
  };

  const handleEditDiscount = (discount: DiscountConfiguration) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      percentage: discount.percentage,
      isVATExempt: discount.isVATExempt,
      conditions: discount.conditions,
      isActive: discount.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingDiscount) {
        await pricingService.updateDiscountConfiguration(editingDiscount.id, {
          ...formData,
          operatorId
        });
      } else {
        await pricingService.createDiscountConfiguration(
          {
            ...formData,
            operatorId
          },
          operatorId // createdBy
        );
      }
      
      setShowForm(false);
      await loadDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save discount configuration');
    }
  };

  const handleDeleteDiscount = async (discount: DiscountConfiguration) => {
    if (!confirm(`Are you sure you want to delete the discount "${discount.name}"?`)) {
      return;
    }

    try {
      await pricingService.deleteDiscountConfiguration(discount.id);
      await loadDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete discount configuration');
    }
  };

  const handleToggleActive = async (discount: DiscountConfiguration) => {
    try {
      await pricingService.updateDiscountConfiguration(discount.id, {
        isActive: !discount.isActive
      });
      await loadDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update discount status');
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'senior': return 'Senior Citizen';
      case 'pwd': return 'Person with Disability';
      case 'custom': return 'Custom Discount';
      default: return type;
    }
  };

  const getDiscountTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'pwd': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading discount configurations...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Discount Configuration</h3>
              <p className="text-gray-600">
                Configure discounts available for your parking locations
              </p>
            </div>
            <Button onClick={handleCreateDiscount}>
              Create Discount
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {discounts.length > 0 ? (
            <div className="space-y-4">
              {discounts.map(discount => (
                <div
                  key={discount.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{discount.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getDiscountTypeBadgeColor(discount.type)}`}>
                            {getDiscountTypeLabel(discount.type)}
                          </span>
                          {!discount.isActive && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{discount.percentage}% discount</span>
                          {discount.isVATExempt && (
                            <span className="text-green-600 font-medium">VAT Exempt</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(discount)}
                      >
                        {discount.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDiscount(discount)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteDiscount(discount)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {Object.keys(discount.conditions).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Conditions</h5>
                      <div className="text-sm text-gray-600">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(discount.conditions, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discounts Configured</h3>
              <p className="text-gray-600 mb-4">
                Create discount configurations to offer special pricing to your customers.
              </p>
              <Button onClick={handleCreateDiscount}>Create Your First Discount</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Discount Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingDiscount ? 'Edit Discount' : 'Create Discount'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Student Discount, Early Bird Special"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="custom">Custom Discount</option>
              <option value="senior">Senior Citizen</option>
              <option value="pwd">Person with Disability</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.percentage}
              onChange={(e) => setFormData(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 20"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the discount percentage (0-100)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="vatExempt"
              checked={formData.isVATExempt}
              onChange={(e) => setFormData(prev => ({ ...prev, isVATExempt: e.target.checked }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="vatExempt" className="text-sm text-gray-700">
              VAT Exempt (no VAT will be charged for this discount)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (discount is available for use)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conditions (JSON)
            </label>
            <textarea
              value={JSON.stringify(formData.conditions, null, 2)}
              onChange={(e) => {
                try {
                  const conditions = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, conditions }));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              placeholder='{"minAmount": 100, "maxUsage": 10}'
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Add conditions for when this discount can be applied (JSON format)
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" onClick={() => setShowForm(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              {editingDiscount ? 'Update Discount' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};