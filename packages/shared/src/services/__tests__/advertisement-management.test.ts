// Advertisement Management Service Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  Advertisement,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
  AdApprovalRequest,
  AdTargetType
} from '../../types/advertisement';

// Mock the supabase import
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}));

import { AdvertisementManagementService } from '../advertisement-management';
import { supabase } from '../../config/supabase';

const mockSupabase = supabase as any;

describe('AdvertisementManagementService', () => {
  let service: AdvertisementManagementService;
  let mockQuery: any;

  beforeEach(() => {
    service = new AdvertisementManagementService();
    mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    mockSupabase.from.mockReturnValue(mockQuery);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

    vi.clearAllMocks();
  });

  describe('createAdvertisement', () => {
    it('should create a new advertisement successfully', async () => {
      const request: CreateAdvertisementRequest = {
        title: 'Test Ad',
        description: 'Test Description',
        contentType: 'image',
        contentUrl: 'https://example.com/image.jpg',
        targetLocationId: 'location-1',
        targetType: 'section',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        budget: 1000,
        costPerImpression: 0.01,
        costPerClick: 0.5
      };

      const mockAdData = {
        id: 'ad-1',
        title: 'Test Ad',
        description: 'Test Description',
        content_type: 'image',
        content_url: 'https://example.com/image.jpg',
        target_location_id: 'location-1',
        target_type: 'section',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        budget: '1000.00',
        cost_per_impression: '0.0100',
        cost_per_click: '0.5000',
        status: 'pending',
        created_by: 'test-user-id',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      mockQuery.single.mockResolvedValue({ data: mockAdData, error: null });

      const result = await service.createAdvertisement(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('advertisements');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        title: request.title,
        description: request.description,
        content_type: request.contentType,
        content_url: request.contentUrl,
        content_text: request.contentText,
        target_location_id: request.targetLocationId,
        target_type: request.targetType,
        start_date: request.startDate.toISOString(),
        end_date: request.endDate.toISOString(),
        budget: request.budget,
        cost_per_impression: request.costPerImpression,
        cost_per_click: request.costPerClick,
        created_by: 'test-user-id'
      });

      expect(result).toEqual({
        id: 'ad-1',
        title: 'Test Ad',
        description: 'Test Description',
        contentType: 'image',
        contentUrl: 'https://example.com/image.jpg',
        contentText: undefined,
        targetLocationId: 'location-1',
        targetType: 'section',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T00:00:00.000Z'),
        budget: 1000,
        costPerImpression: 0.01,
        costPerClick: 0.5,
        status: 'pending',
        createdBy: 'test-user-id',
        approvedBy: undefined,
        approvedAt: undefined,
        rejectionReason: undefined,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      });
    });

    it('should throw error when conflicts exist', async () => {
      const request: CreateAdvertisementRequest = {
        title: 'Test Ad',
        contentType: 'image',
        targetLocationId: 'location-1',
        targetType: 'section',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        budget: 1000
      };

      // Mock conflict detection
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          conflicting_ad_id: 'existing-ad',
          conflicting_ad_title: 'Existing Ad',
          conflict_start: '2024-01-01T00:00:00.000Z',
          conflict_end: '2024-01-31T00:00:00.000Z'
        }],
        error: null
      });

      await expect(service.createAdvertisement(request))
        .rejects.toThrow('Advertisement conflicts detected with existing ads: Existing Ad');
    });

    it('should handle database errors', async () => {
      const request: CreateAdvertisementRequest = {
        title: 'Test Ad',
        contentType: 'image',
        targetLocationId: 'location-1',
        targetType: 'section',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        budget: 1000
      };

      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(service.createAdvertisement(request))
        .rejects.toThrow('Failed to create advertisement: Database error');
    });
  });

  describe('getAdvertisement', () => {
    it('should get advertisement by ID', async () => {
      const mockAdData = {
        id: 'ad-1',
        title: 'Test Ad',
        content_type: 'image',
        target_location_id: 'location-1',
        target_type: 'section',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        budget: '1000.00',
        cost_per_impression: '0.0100',
        cost_per_click: '0.5000',
        status: 'active',
        created_by: 'test-user-id',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      mockQuery.single.mockResolvedValue({ data: mockAdData, error: null });

      const result = await service.getAdvertisement('ad-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('advertisements');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ad-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('ad-1');
      expect(result?.title).toBe('Test Ad');
    });

    it('should return null when advertisement not found', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await service.getAdvertisement('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listAdvertisements', () => {
    it('should list advertisements with filters and pagination', async () => {
      const mockAdsData = [
        {
          id: 'ad-1',
          title: 'Test Ad 1',
          content_type: 'image',
          target_location_id: 'location-1',
          target_type: 'section',
          start_date: '2024-01-01T00:00:00.000Z',
          end_date: '2024-01-31T00:00:00.000Z',
          budget: '1000.00',
          cost_per_impression: '0.0100',
          cost_per_click: '0.5000',
          status: 'active',
          created_by: 'test-user-id',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Create a complete mock query chain
      const mockListQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAdsData,
          error: null,
          count: 1
        })
      };

      mockSupabase.from.mockReturnValue(mockListQuery);

      const result = await service.listAdvertisements(
        { status: ['active'] },
        { field: 'title', direction: 'asc' },
        1,
        10
      );

      expect(result.advertisements).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('updateAdvertisement', () => {
    it('should update advertisement successfully', async () => {
      const updateRequest: UpdateAdvertisementRequest = {
        title: 'Updated Ad',
        status: 'active'
      };

      const mockCurrentAd = {
        id: 'ad-1',
        title: 'Test Ad',
        targetLocationId: 'location-1',
        targetType: 'section' as AdTargetType,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const mockUpdatedData = {
        id: 'ad-1',
        title: 'Updated Ad',
        content_type: 'image',
        target_location_id: 'location-1',
        target_type: 'section',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        budget: '1000.00',
        cost_per_impression: '0.0100',
        cost_per_click: '0.5000',
        status: 'active',
        created_by: 'test-user-id',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock getAdvertisement call
      vi.spyOn(service, 'getAdvertisement').mockResolvedValue(mockCurrentAd as Advertisement);

      mockQuery.single.mockResolvedValue({ data: mockUpdatedData, error: null });

      const result = await service.updateAdvertisement('ad-1', updateRequest);

      expect(mockQuery.update).toHaveBeenCalledWith({
        title: 'Updated Ad',
        status: 'active'
      });
      expect(result.title).toBe('Updated Ad');
      expect(result.status).toBe('active');
    });
  });

  describe('approveAdvertisement', () => {
    it('should approve advertisement successfully', async () => {
      const approvalRequest: AdApprovalRequest = {
        advertisementId: 'ad-1',
        approved: true
      };

      const mockApprovedData = {
        id: 'ad-1',
        title: 'Test Ad',
        content_type: 'image',
        target_location_id: 'location-1',
        target_type: 'section',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        budget: '1000.00',
        cost_per_impression: '0.0100',
        cost_per_click: '0.5000',
        status: 'approved',
        created_by: 'test-user-id',
        approved_by: 'admin-user-id',
        approved_at: '2024-01-01T12:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T12:00:00.000Z'
      };

      mockQuery.single.mockResolvedValue({ data: mockApprovedData, error: null });

      const result = await service.approveAdvertisement(approvalRequest);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          approved_by: 'test-user-id'
        })
      );
      expect(result.status).toBe('approved');
    });

    it('should reject advertisement with reason', async () => {
      const approvalRequest: AdApprovalRequest = {
        advertisementId: 'ad-1',
        approved: false,
        rejectionReason: 'Inappropriate content'
      };

      const mockRejectedData = {
        id: 'ad-1',
        title: 'Test Ad',
        content_type: 'image',
        target_location_id: 'location-1',
        target_type: 'section',
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T00:00:00.000Z',
        budget: '1000.00',
        cost_per_impression: '0.0100',
        cost_per_click: '0.5000',
        status: 'rejected',
        created_by: 'test-user-id',
        approved_by: 'admin-user-id',
        approved_at: '2024-01-01T12:00:00.000Z',
        rejection_reason: 'Inappropriate content',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T12:00:00.000Z'
      };

      mockQuery.single.mockResolvedValue({ data: mockRejectedData, error: null });

      const result = await service.approveAdvertisement(approvalRequest);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          rejection_reason: 'Inappropriate content'
        })
      );
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Inappropriate content');
    });
  });

  describe('deleteAdvertisement', () => {
    it('should delete advertisement successfully', async () => {
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      await service.deleteAdvertisement('ad-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('advertisements');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'ad-1');
    });

    it('should handle delete errors', async () => {
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
      };

      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      await expect(service.deleteAdvertisement('ad-1'))
        .rejects.toThrow('Failed to delete advertisement: Delete failed');
    });
  });

  describe('checkConflicts', () => {
    it('should detect conflicts correctly', async () => {
      const conflictData = [
        {
          conflicting_ad_id: 'existing-ad',
          conflicting_ad_title: 'Existing Ad',
          conflict_start: '2024-01-15T00:00:00.000Z',
          conflict_end: '2024-01-20T00:00:00.000Z'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({ data: conflictData, error: null });

      const conflicts = await service.checkConflicts(
        'location-1',
        'section',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_advertisement_conflicts', {
        p_target_location_id: 'location-1',
        p_target_type: 'section',
        p_start_date: '2024-01-01T00:00:00.000Z',
        p_end_date: '2024-01-31T00:00:00.000Z',
        p_exclude_ad_id: null
      });

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].ad2Id).toBe('existing-ad');
      expect(conflicts[0].ad2Title).toBe('Existing Ad');
    });
  });

  describe('getAnalytics', () => {
    it('should return advertisement analytics', async () => {
      // Mock counts query
      const mockCountsQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { status: 'active' },
            { status: 'active' },
            { status: 'pending' }
          ],
          error: null
        })
      };

      // Mock metrics query
      const mockMetricsQuery = {
        select: vi.fn().mockResolvedValue({
          data: [
            { impressions: 1000, clicks: 50, total_cost: '25.00' },
            { impressions: 2000, clicks: 100, total_cost: '50.00' }
          ],
          error: null
        })
      };

      // Mock top ads query
      const mockTopAdsQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              advertisement_id: 'ad-1',
              impressions: 2000,
              clicks: 100,
              advertisements: { title: 'Top Ad' }
            }
          ],
          error: null
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockCountsQuery)
        .mockReturnValueOnce(mockMetricsQuery)
        .mockReturnValueOnce(mockTopAdsQuery);

      const analytics = await service.getAnalytics();

      expect(analytics.totalAds).toBe(3);
      expect(analytics.activeAds).toBe(2);
      expect(analytics.pendingApproval).toBe(1);
      expect(analytics.totalRevenue).toBe(75);
      expect(analytics.totalImpressions).toBe(3000);
      expect(analytics.totalClicks).toBe(150);
      expect(analytics.averageCTR).toBe(5); // (150/3000) * 100
      expect(analytics.topPerformingAds).toHaveLength(1);
    });
  });
});