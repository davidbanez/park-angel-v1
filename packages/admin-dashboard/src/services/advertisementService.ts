// Advertisement Service for Admin Dashboard

import { advertisementService as sharedService } from '../../../shared/src/services/advertisement-management';
import type {
  Advertisement,
  AdMetrics,
  AdPayment,
  AdConflict,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
  AdApprovalRequest,
  AdPerformanceReport,
  AdFilterOptions,
  AdSortOptions,
  AdListResponse,
  AdAnalytics
} from '../../../shared/src/types/advertisement';

export class AdminAdvertisementService {
  /**
   * Create a new advertisement
   */
  async createAdvertisement(request: CreateAdvertisementRequest): Promise<Advertisement> {
    return sharedService.createAdvertisement(request);
  }

  /**
   * Get advertisement by ID
   */
  async getAdvertisement(id: string): Promise<Advertisement | null> {
    return sharedService.getAdvertisement(id);
  }

  /**
   * List advertisements with filtering and pagination
   */
  async listAdvertisements(
    filters?: AdFilterOptions,
    sort?: AdSortOptions,
    page = 1,
    limit = 20
  ): Promise<AdListResponse> {
    return sharedService.listAdvertisements(filters, sort, page, limit);
  }

  /**
   * Update advertisement
   */
  async updateAdvertisement(id: string, request: UpdateAdvertisementRequest): Promise<Advertisement> {
    return sharedService.updateAdvertisement(id, request);
  }

  /**
   * Approve or reject advertisement
   */
  async approveAdvertisement(request: AdApprovalRequest): Promise<Advertisement> {
    return sharedService.approveAdvertisement(request);
  }

  /**
   * Delete advertisement
   */
  async deleteAdvertisement(id: string): Promise<void> {
    return sharedService.deleteAdvertisement(id);
  }

  /**
   * Check for advertisement conflicts
   */
  async checkConflicts(
    targetLocationId: string,
    targetType: 'section' | 'zone',
    startDate: Date,
    endDate: Date,
    excludeAdId?: string
  ): Promise<AdConflict[]> {
    return sharedService.checkConflicts(targetLocationId, targetType, startDate, endDate, excludeAdId);
  }

  /**
   * Get advertisement metrics
   */
  async getAdvertisementMetrics(
    advertisementId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AdMetrics[]> {
    return sharedService.getAdvertisementMetrics(advertisementId, dateRange);
  }

  /**
   * Update advertisement metrics
   */
  async updateMetrics(advertisementId: string, impressions = 0, clicks = 0, conversions = 0): Promise<void> {
    return sharedService.updateMetrics(advertisementId, impressions, clicks, conversions);
  }

  /**
   * Get advertisement performance report
   */
  async getPerformanceReport(
    advertisementId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AdPerformanceReport> {
    return sharedService.getPerformanceReport(advertisementId, dateRange);
  }

  /**
   * Get advertisement analytics
   */
  async getAnalytics(): Promise<AdAnalytics> {
    return sharedService.getAnalytics();
  }

  /**
   * Get advertisement payments
   */
  async getAdvertisementPayments(advertisementId: string): Promise<AdPayment[]> {
    return sharedService.getAdvertisementPayments(advertisementId);
  }

  /**
   * Create advertisement payment
   */
  async createPayment(advertisementId: string, amount: number, paymentMethod: string): Promise<AdPayment> {
    return sharedService.createPayment(advertisementId, amount, paymentMethod);
  }

  /**
   * Bulk approve advertisements
   */
  async bulkApprove(advertisementIds: string[], approved: boolean, rejectionReason?: string): Promise<void> {
    const promises = advertisementIds.map(id =>
      this.approveAdvertisement({
        advertisementId: id,
        approved,
        rejectionReason
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Get advertisements requiring approval
   */
  async getPendingApprovals(): Promise<Advertisement[]> {
    const response = await this.listAdvertisements(
      { status: ['pending'] },
      { field: 'createdAt', direction: 'asc' },
      1,
      100
    );
    return response.advertisements;
  }

  /**
   * Get advertisement revenue summary
   */
  async getRevenueSummary(dateRange?: { startDate: Date; endDate: Date }): Promise<{
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    averageCPM: number;
    averageCPC: number;
    topPerformers: Array<{
      id: string;
      title: string;
      revenue: number;
      impressions: number;
      clicks: number;
    }>;
  }> {
    const analytics = await this.getAnalytics();
    
    // For now, return the basic analytics data
    // In a real implementation, you would filter by date range and calculate more detailed metrics
    return {
      totalRevenue: analytics.totalRevenue,
      totalImpressions: analytics.totalImpressions,
      totalClicks: analytics.totalClicks,
      averageCPM: analytics.totalImpressions > 0 ? (analytics.totalRevenue / analytics.totalImpressions) * 1000 : 0,
      averageCPC: analytics.totalClicks > 0 ? analytics.totalRevenue / analytics.totalClicks : 0,
      topPerformers: analytics.topPerformingAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        revenue: 0, // Would need to calculate from metrics
        impressions: ad.impressions,
        clicks: ad.clicks
      }))
    };
  }

  /**
   * Export advertisement data
   */
  async exportAdvertisements(
    filters?: AdFilterOptions,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const response = await this.listAdvertisements(filters, undefined, 1, 10000);
    const advertisements = response.advertisements;

    if (format === 'csv') {
      const headers = [
        'ID',
        'Title',
        'Description',
        'Content Type',
        'Target Type',
        'Target Location ID',
        'Start Date',
        'End Date',
        'Budget',
        'Cost Per Impression',
        'Cost Per Click',
        'Status',
        'Created By',
        'Approved By',
        'Approved At',
        'Created At'
      ];

      const csvContent = [
        headers.join(','),
        ...advertisements.map(ad => [
          ad.id,
          `"${ad.title}"`,
          `"${ad.description || ''}"`,
          ad.contentType,
          ad.targetType,
          ad.targetLocationId,
          ad.startDate.toISOString(),
          ad.endDate.toISOString(),
          ad.budget,
          ad.costPerImpression,
          ad.costPerClick,
          ad.status,
          ad.createdBy,
          ad.approvedBy || '',
          ad.approvedAt?.toISOString() || '',
          ad.createdAt.toISOString()
        ].join(','))
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv' });
    }

    // For Excel format, you would use a library like xlsx
    throw new Error('Excel export not implemented yet');
  }
}

export const adminAdvertisementService = new AdminAdvertisementService();