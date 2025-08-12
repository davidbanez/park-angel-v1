import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { customerManagementService } from '../../../../shared/src/services/customer-management';
import type { CustomerProfile, VIPAssignment, VIPType } from '../../../../shared/src/types/user';

interface VIPAssignmentProps {
  customer: CustomerProfile;
  operatorId: string;
  currentUserId: string;
  onUpdate?: () => void;
}

export const VIPAssignmentComponent: React.FC<VIPAssignmentProps> = ({ 
  customer, 
  operatorId, 
  currentUserId, 
  onUpdate 
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vipType: 'vvip' as VIPType,
    assignedSpots: [] as string[],
    timeLimitHours: undefined as number | undefined,
    notes: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: ''
  });

  const vipTypeDescriptions = {
    vvip: 'Free parking anywhere, anytime with no restrictions',
    flex_vvip: 'Free parking anywhere with time limits',
    spot_vip: 'Free parking on specific spots with no time limit',
    spot_flex_vip: 'Free parking on specific spots with time limits'
  };

  const vipTypeLabels = {
    vvip: 'VVIP',
    flex_vvip: 'Flex VVIP',
    spot_vip: 'Spot VIP',
    spot_flex_vip: 'Spot Flex VIP'
  };

  const handleAssignVIP = async () => {
    try {
      setLoading(true);
      setError(null);

      const vipAssignment: Omit<VIPAssignment, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: customer.id,
        operatorId,
        vipType: formData.vipType,
        assignedSpots: formData.assignedSpots,
        timeLimitHours: formData.timeLimitHours,
        notes: formData.notes,
        isActive: true,
        validFrom: new Date(formData.validFrom),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        createdBy: currentUserId
      };

      await customerManagementService.assignVIP(vipAssignment);
      setShowAssignModal(false);
      resetForm();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign VIP status');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVIP = async (vipId: string) => {
    try {
      setLoading(true);
      await customerManagementService.removeVIPAssignment(vipId);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove VIP status');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vipType: 'vvip',
      assignedSpots: [],
      timeLimitHours: undefined,
      notes: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: ''
    });
  };

  const getVIPBadge = (vipType: VIPType, isActive: boolean) => {
    const vipColors = {
      vvip: 'bg-purple-100 text-purple-800',
      flex_vvip: 'bg-blue-100 text-blue-800',
      spot_vip: 'bg-yellow-100 text-yellow-800',
      spot_flex_vip: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${vipColors[vipType]} ${!isActive ? 'opacity-50' : ''}`}>
        {vipTypeLabels[vipType]} {!isActive && '(Inactive)'}
      </span>
    );
  };

  const requiresSpots = formData.vipType === 'spot_vip' || formData.vipType === 'spot_flex_vip';
  const requiresTimeLimit = formData.vipType === 'flex_vvip' || formData.vipType === 'spot_flex_vip';

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">VIP Status</h3>
            <Button onClick={() => setShowAssignModal(true)}>
              Assign VIP
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {customer.vipAssignments && customer.vipAssignments.length > 0 ? (
            <div className="space-y-4">
              {customer.vipAssignments.map((vip) => (
                <div key={vip.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      {getVIPBadge(vip.vipType, vip.isActive)}
                      <div className="text-sm text-secondary-600">
                        Valid from {vip.validFrom.toLocaleDateString()}
                        {vip.validUntil && ` until ${vip.validUntil.toLocaleDateString()}`}
                      </div>
                    </div>
                    {vip.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveVIP(vip.id)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-secondary-600 mb-2">
                    {vipTypeDescriptions[vip.vipType]}
                  </div>

                  {vip.timeLimitHours && (
                    <div className="text-sm text-secondary-600 mb-2">
                      <strong>Time Limit:</strong> {vip.timeLimitHours} hours
                    </div>
                  )}

                  {vip.assignedSpots.length > 0 && (
                    <div className="text-sm text-secondary-600 mb-2">
                      <strong>Assigned Spots:</strong> {vip.assignedSpots.join(', ')}
                    </div>
                  )}

                  {vip.notes && (
                    <div className="text-sm text-secondary-600">
                      <strong>Notes:</strong> {vip.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-secondary-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-secondary-900 mb-2">No VIP Status</h4>
              <p className="text-secondary-600">This customer doesn't have any VIP assignments.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Assign VIP Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          resetForm();
          setError(null);
        }}
        title="Assign VIP Status"
      >
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              VIP Type
            </label>
            <select
              value={formData.vipType}
              onChange={(e) => setFormData({ ...formData, vipType: e.target.value as VIPType })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(vipTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-sm text-secondary-600 mt-1">
              {vipTypeDescriptions[formData.vipType]}
            </p>
          </div>

          {requiresTimeLimit && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Time Limit (Hours)
              </label>
              <Input
                type="number"
                min="1"
                max="24"
                value={formData.timeLimitHours || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  timeLimitHours: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Enter time limit in hours"
              />
            </div>
          )}

          {requiresSpots && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Assigned Spots
              </label>
              <Input
                type="text"
                value={formData.assignedSpots.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  assignedSpots: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                })}
                placeholder="Enter spot IDs separated by commas"
              />
              <p className="text-sm text-secondary-600 mt-1">
                Enter the specific parking spot IDs this VIP can use
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Valid From
            </label>
            <Input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Valid Until (Optional)
            </label>
            <Input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Add any additional notes about this VIP assignment"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                resetForm();
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignVIP}
              disabled={loading || (requiresTimeLimit && !formData.timeLimitHours) || (requiresSpots && formData.assignedSpots.length === 0)}
            >
              {loading ? 'Assigning...' : 'Assign VIP'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};