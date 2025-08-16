import type { Advertisement, AdMetrics, AdPayment, AdConflict, CreateAdvertisementRequest, UpdateAdvertisementRequest, AdApprovalRequest, AdPerformanceReport, AdFilterOptions, AdSortOptions, AdListResponse, AdAnalytics, AdTargetType } from '../types/advertisement';
export declare class AdvertisementManagementService {
    /**
     * Create a new advertisement
     */
    createAdvertisement(request: CreateAdvertisementRequest): Promise<Advertisement>;
    /**
     * Get advertisement by ID
     */
    getAdvertisement(id: string): Promise<Advertisement | null>;
    /**
     * List advertisements with filtering and pagination
     */
    listAdvertisements(filters?: AdFilterOptions, sort?: AdSortOptions, page?: number, limit?: number): Promise<AdListResponse>;
    /**
     * Update advertisement
     */
    updateAdvertisement(id: string, request: UpdateAdvertisementRequest): Promise<Advertisement>;
    /**
     * Approve or reject advertisement
     */
    approveAdvertisement(request: AdApprovalRequest): Promise<Advertisement>;
    /**
     * Delete advertisement
     */
    deleteAdvertisement(id: string): Promise<void>;
    /**
     * Check for advertisement conflicts
     */
    checkConflicts(targetLocationId: string, targetType: AdTargetType, startDate: Date, endDate: Date, excludeAdId?: string): Promise<AdConflict[]>;
    /**
     * Get advertisement metrics
     */
    getAdvertisementMetrics(advertisementId: string, dateRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<AdMetrics[]>;
    /**
     * Update advertisement metrics
     */
    updateMetrics(advertisementId: string, impressions?: number, clicks?: number, conversions?: number): Promise<void>;
    /**
     * Get advertisement performance report
     */
    getPerformanceReport(advertisementId: string, dateRange?: {
        startDate: Date;
        endDate: Date;
    }): Promise<AdPerformanceReport>;
    /**
     * Get advertisement analytics
     */
    getAnalytics(): Promise<AdAnalytics>;
    /**
     * Get advertisement payments
     */
    getAdvertisementPayments(advertisementId: string): Promise<AdPayment[]>;
    /**
     * Create advertisement payment
     */
    createPayment(advertisementId: string, amount: number, paymentMethod: string): Promise<AdPayment>;
    private mapDatabaseToAdvertisement;
    private mapSortFieldToColumn;
}
export declare const advertisementService: AdvertisementManagementService;
