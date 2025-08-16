import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { adminAdvertisementService } from '../services/advertisementService';
import type {
  Advertisement,
  AdStatus,
  AdTargetType,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
  AdFilterOptions,
  AdSortOptions,
  AdAnalytics,
  AdPerformanceReport
} from '../../../shared/src/types/advertisement';

interface AdvertisementManagementProps {}

export const AdvertisementManagement: React.FC<AdvertisementManagementProps> = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<AdPerformanceReport | null>(null);
  const [filters, setFilters] = useState<AdFilterOptions>({});
  const [sort, setSort] = useState<AdSortOptions>({ field: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    loadAdvertisements();
    loadAnalytics();
  }, [filters, sort, currentPage]);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await adminAdvertisementService.listAdvertisements(
        filters,
        sort,
        currentPage,
        pageSize
      );
      setAdvertisements(response.advertisements);
      setTotalCount(response.totalCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await adminAdvertisementService.getAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleCreateAdvertisement = async (data: CreateAdvertisementRequest) => {
    try {
      await adminAdvertisementService.createAdvertisement(data);
      setShowCreateModal(false);
      loadAdvertisements();
      loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create advertisement');
    }
  };

  const handleUpdateAdvertisement = async (data: UpdateAdvertisementRequest) => {
    if (!selectedAd) return;
    
    try {
      await adminAdvertisementService.updateAdvertisement(selectedAd.id, data);
      setShowEditModal(false);
      setSelectedAd(null);
      loadAdvertisements();
      loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update advertisement');
    }
  };

  const handleApproveAdvertisement = async (approved: boolean, rejectionReason?: string) => {
    if (!selectedAd) return;

    try {
      await adminAdvertisementService.approveAdvertisement({
        advertisementId: selectedAd.id,
        approved,
        rejectionReason
      });
      setShowApprovalModal(false);
      setSelectedAd(null);
      loadAdvertisements();
      loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve advertisement');
    }
  };

  const handleDeleteAdvertisement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;

    try {
      await adminAdvertisementService.deleteAdvertisement(id);
      loadAdvertisements();
      loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete advertisement');
    }
  };

  const handleViewPerformance = async (ad: Advertisement) => {
    try {
      const report = await adminAdvertisementService.getPerformanceReport(ad.id);
      setPerformanceReport(report);
      setSelectedAd(ad);
      setShowPerformanceModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance report');
    }
  };

  const getStatusColor = (status: AdStatus): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paused': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-purple-600 bg-purple-100';

      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (ad: Advertisement) => (
        <div>
          <div className="font-medium text-gray-900">{ad.title}</div>
          <div className="text-sm text-gray-500">{ad.description}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (ad: Advertisement) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ad.status)}`}>
          {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
        </span>
      )
    },
    {
      key: 'targetType',
      label: 'Target',
      render: (ad: Advertisement) => (
        <div className="text-sm">
          <div className="font-medium">{ad.targetType.charAt(0).toUpperCase() + ad.targetType.slice(1)}</div>
          <div className="text-gray-500">{ad.targetLocationId}</div>
        </div>
      )
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (ad: Advertisement) => (
        <div className="text-sm">
          <div>{ad.startDate.toLocaleDateString()}</div>
          <div className="text-gray-500">to {ad.endDate.toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (ad: Advertisement) => (
        <div className="text-sm font-medium">
          ${ad.budget.toFixed(2)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ad: Advertisement) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedAd(ad);
              setShowEditModal(true);
            }}
          >
            Edit
          </Button>
          {ad.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedAd(ad);
                setShowApprovalModal(true);
              }}
            >
              Review
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewPerformance(ad)}
          >
            Performance
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteAdvertisement(ad.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-gray-600">Manage advertisements and monitor performance</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Advertisement
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Ads</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalAds}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Ads</p>
                <p className="text-2xl font-bold text-green-600">{analytics.activeAds}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.pendingApproval}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${analytics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.status?.[0] || ''}
              onChange={(e) => setFilters({
                ...filters,
                status: e.target.value ? [e.target.value as AdStatus] : undefined
              })}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.targetType?.[0] || ''}
              onChange={(e) => setFilters({
                ...filters,
                targetType: e.target.value ? [e.target.value as AdTargetType] : undefined
              })}
            >
              <option value="">All Types</option>
              <option value="section">Section</option>
              <option value="zone">Zone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              placeholder="Search advertisements..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({
                ...filters,
                searchQuery: e.target.value || undefined
              })}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Advertisements Table */}
      <Card>
        <DataTable
          columns={columns}
          data={advertisements}
          loading={loading}
        />
        
        {/* Simple pagination */}
        {totalCount > pageSize && (
          <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Advertisement Modal */}
      <CreateAdvertisementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAdvertisement}
      />

      {/* Edit Advertisement Modal */}
      <EditAdvertisementModal
        isOpen={showEditModal}
        advertisement={selectedAd}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAd(null);
        }}
        onSubmit={handleUpdateAdvertisement}
      />

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        advertisement={selectedAd}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedAd(null);
        }}
        onApprove={handleApproveAdvertisement}
      />

      {/* Performance Modal */}
      <PerformanceModal
        isOpen={showPerformanceModal}
        advertisement={selectedAd}
        report={performanceReport}
        onClose={() => {
          setShowPerformanceModal(false);
          setSelectedAd(null);
          setPerformanceReport(null);
        }}
      />
    </div>
  );
};

// Create Advertisement Modal Component
interface CreateAdvertisementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdvertisementRequest) => void;
}

const CreateAdvertisementModal: React.FC<CreateAdvertisementModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateAdvertisementRequest>({
    title: '',
    description: '',
    contentType: 'image',
    contentUrl: '',
    contentText: '',
    targetLocationId: '',
    targetType: 'section',
    startDate: new Date(),
    endDate: new Date(),
    budget: 0,
    costPerImpression: 0,
    costPerClick: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Advertisement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="banner">Banner</option>
              <option value="interstitial">Interstitial</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
            >
              <option value="section">Section</option>
              <option value="zone">Zone</option>
            </select>
          </div>
        </div>

        {formData.contentType !== 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
            <Input
              type="url"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
            />
          </div>
        )}

        {formData.contentType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Text</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              value={formData.contentText}
              onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Location ID</label>
          <Input
            required
            value={formData.targetLocationId}
            onChange={(e) => setFormData({ ...formData, targetLocationId: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="datetime-local"
              required
              value={formData.startDate.toISOString().slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="datetime-local"
              required
              value={formData.endDate.toISOString().slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Impression ($)</label>
            <Input
              type="number"
              min="0"
              step="0.0001"
              value={formData.costPerImpression}
              onChange={(e) => setFormData({ ...formData, costPerImpression: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Click ($)</label>
            <Input
              type="number"
              min="0"
              step="0.0001"
              value={formData.costPerClick}
              onChange={(e) => setFormData({ ...formData, costPerClick: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Advertisement
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Advertisement Modal Component
interface EditAdvertisementModalProps {
  isOpen: boolean;
  advertisement: Advertisement | null;
  onClose: () => void;
  onSubmit: (data: UpdateAdvertisementRequest) => void;
}

const EditAdvertisementModal: React.FC<EditAdvertisementModalProps> = ({
  isOpen,
  advertisement,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<UpdateAdvertisementRequest>({});

  useEffect(() => {
    if (advertisement) {
      setFormData({
        title: advertisement.title,
        description: advertisement.description,
        contentType: advertisement.contentType,
        contentUrl: advertisement.contentUrl,
        contentText: advertisement.contentText,
        targetLocationId: advertisement.targetLocationId,
        targetType: advertisement.targetType,
        startDate: advertisement.startDate,
        endDate: advertisement.endDate,
        budget: advertisement.budget,
        costPerImpression: advertisement.costPerImpression,
        costPerClick: advertisement.costPerClick,
        status: advertisement.status
      });
    }
  }, [advertisement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!advertisement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Advertisement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.status || ''}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AdStatus })}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.budget || 0}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Update Advertisement
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Approval Modal Component
interface ApprovalModalProps {
  isOpen: boolean;
  advertisement: Advertisement | null;
  onClose: () => void;
  onApprove: (approved: boolean, rejectionReason?: string) => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  advertisement,
  onClose,
  onApprove
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!advertisement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Advertisement">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{advertisement.title}</h3>
          <p className="text-gray-600">{advertisement.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Content Type:</span> {advertisement.contentType}
          </div>
          <div>
            <span className="font-medium">Target:</span> {advertisement.targetType}
          </div>
          <div>
            <span className="font-medium">Budget:</span> ${advertisement.budget.toFixed(2)}
          </div>
          <div>
            <span className="font-medium">Schedule:</span> {advertisement.startDate.toLocaleDateString()} - {advertisement.endDate.toLocaleDateString()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => onApprove(false, rejectionReason)}
          >
            Reject
          </Button>
          <Button
            type="button"
            onClick={() => onApprove(true)}
          >
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Performance Modal Component
interface PerformanceModalProps {
  isOpen: boolean;
  advertisement: Advertisement | null;
  report: AdPerformanceReport | null;
  onClose: () => void;
}

const PerformanceModal: React.FC<PerformanceModalProps> = ({
  isOpen,
  advertisement,
  report,
  onClose
}) => {
  if (!advertisement || !report) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advertisement Performance">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
          <p className="text-sm text-gray-600">
            {report.dateRange.startDate.toLocaleDateString()} - {report.dateRange.endDate.toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{report.totalImpressions.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Impressions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{report.totalClicks.toLocaleString()}</div>
            <div className="text-sm text-green-800">Total Clicks</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{report.averageCTR.toFixed(2)}%</div>
            <div className="text-sm text-purple-800">Click-Through Rate</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${report.totalCost.toFixed(2)}</div>
            <div className="text-sm text-orange-800">Total Cost</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Avg CPC:</span> ${report.averageCPC.toFixed(4)}
          </div>
          <div>
            <span className="font-medium">Avg CPM:</span> ${report.averageCPM.toFixed(4)}
          </div>
          <div>
            <span className="font-medium">Conversion Rate:</span> {report.conversionRate.toFixed(2)}%
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};