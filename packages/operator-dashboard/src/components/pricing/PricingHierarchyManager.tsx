import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { PricingConfigForm } from './PricingConfigForm';
import { PricingInheritanceViewer } from './PricingInheritanceViewer';
import { HierarchicalPricingService, PricingHierarchyNode } from '../../../../shared/src/services/hierarchical-pricing';
import { createClient } from '@supabase/supabase-js';

interface PricingHierarchyManagerProps {
  locationId: string;
  operatorId: string;
}

export const PricingHierarchyManager: React.FC<PricingHierarchyManagerProps> = ({
  locationId
}) => {
  const [hierarchy, setHierarchy] = useState<PricingHierarchyNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<PricingHierarchyNode | null>(null);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [showInheritanceViewer, setShowInheritanceViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL!,
    process.env.REACT_APP_SUPABASE_ANON_KEY!
  );
  const pricingService = new HierarchicalPricingService(supabase);

  useEffect(() => {
    loadHierarchy();
  }, [locationId]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const hierarchyData = await pricingService.getPricingHierarchy(locationId);
      setHierarchy(hierarchyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = (node: PricingHierarchyNode) => {
    setSelectedNode(node);
  };

  const handleEditPricing = (node: PricingHierarchyNode) => {
    setSelectedNode(node);
    setShowPricingForm(true);
  };

  const handleViewInheritance = (node: PricingHierarchyNode) => {
    setSelectedNode(node);
    setShowInheritanceViewer(true);
  };

  const handlePricingUpdate = async () => {
    setShowPricingForm(false);
    await loadHierarchy();
  };

  const handleCopyToChildren = async (node: PricingHierarchyNode) => {
    try {
      await pricingService.copyPricingToChildren(node.level, node.id, false);
      await loadHierarchy();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy pricing to children');
    }
  };

  const handleRemovePricing = async (node: PricingHierarchyNode) => {
    try {
      await pricingService.removePricing(node.level, node.id);
      await loadHierarchy();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pricing');
    }
  };

  const renderHierarchyNode = (node: PricingHierarchyNode, depth: number = 0) => {
    const hasOwnPricing = !!node.pricingConfig;
    const hasEffectivePricing = !!node.effectivePricing;
    const isInherited = hasEffectivePricing && !hasOwnPricing;

    return (
      <div key={node.id} className={`ml-${depth * 4}`}>
        <div
          className={`p-4 border rounded-lg mb-2 cursor-pointer transition-colors ${
            selectedNode?.id === node.id
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleNodeSelect(node)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500 uppercase">
                  {node.level}
                </span>
                <span className="font-semibold text-gray-900">{node.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {hasOwnPricing && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Own Pricing
                  </span>
                )}
                {isInherited && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Inherited
                  </span>
                )}
                {!hasEffectivePricing && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    Default
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {hasEffectivePricing && node.effectivePricing && (
                <span className="text-sm font-medium text-gray-900">
                  ₱{node.effectivePricing.baseRate.value}/hr
                </span>
              )}
              
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPricing(node);
                  }}
                >
                  {hasOwnPricing ? 'Edit' : 'Set'} Pricing
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewInheritance(node);
                  }}
                >
                  View Details
                </Button>

                {hasOwnPricing && node.children && node.children.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyToChildren(node);
                    }}
                  >
                    Copy to Children
                  </Button>
                )}

                {hasOwnPricing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePricing(node);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hasEffectivePricing && node.effectivePricing && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>VAT: {node.effectivePricing.vatRate.value}%</span>
                <span>Vehicle Types: {node.effectivePricing.vehicleTypeRates.length}</span>
                <span>Time Rules: {node.effectivePricing.timeBasedRates.length}</span>
                <span>Holiday Rules: {node.effectivePricing.holidayRates.length}</span>
              </div>
            </div>
          )}
        </div>

        {node.children?.map(child => renderHierarchyNode(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pricing hierarchy...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Pricing</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadHierarchy}>Try Again</Button>
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
              <h3 className="text-lg font-semibold text-gray-900">Pricing Hierarchy</h3>
              <p className="text-gray-600">
                Configure pricing at any level. Child elements inherit parent pricing unless overridden.
              </p>
            </div>
            <Button onClick={loadHierarchy} variant="outline">
              Refresh
            </Button>
          </div>

          {hierarchy && (
            <div className="space-y-2">
              {renderHierarchyNode(hierarchy)}
            </div>
          )}
        </div>
      </Card>

      {/* Pricing Configuration Modal */}
      <Modal
        isOpen={showPricingForm}
        onClose={() => setShowPricingForm(false)}
        title={`Configure Pricing - ${selectedNode?.name}`}
        size="lg"
      >
        {selectedNode && (
          <PricingConfigForm
            node={selectedNode}
            onSave={handlePricingUpdate}
            onCancel={() => setShowPricingForm(false)}
          />
        )}
      </Modal>

      {/* Pricing Inheritance Viewer Modal */}
      <Modal
        isOpen={showInheritanceViewer}
        onClose={() => setShowInheritanceViewer(false)}
        title={`Pricing Details - ${selectedNode?.name}`}
        size="lg"
      >
        {selectedNode && (
          <PricingInheritanceViewer
            node={selectedNode}
            onClose={() => setShowInheritanceViewer(false)}
          />
        )}
      </Modal>
    </div>
  );
};