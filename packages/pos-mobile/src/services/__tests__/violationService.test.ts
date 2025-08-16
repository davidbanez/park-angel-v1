import { ViolationService } from '../violationService';
import { ViolationReport, EnforcementAction } from '../../types/pos';

// Mock Supabase
jest.mock('@park-angel/shared/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-violation-id',
              reported_by: 'test-operator',
              vehicle_plate_number: 'ABC 1234',
              violation_type: 'illegal_parking',
              description: 'Test violation',
              photos: ['photo1.jpg'],
              coordinates: { latitude: 14.5995, longitude: 120.9842 },
              status: 'reported',
              priority: 'normal',
              created_at: new Date().toISOString(),
            },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-violation-id',
                status: 'resolved',
              },
              error: null
            }))
          }))
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({
          data: { path: 'test-path' },
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://test-url.com/photo.jpg' }
        }))
      }))
    }
  }
}));

// Mock LicensePlateService
jest.mock('../licensePlateService', () => ({
  LicensePlateService: {
    getInstance: jest.fn(() => ({
      scanLicensePlate: jest.fn(() => Promise.resolve({
        plateNumber: 'ABC 1234',
        confidence: 0.95,
        boundingBox: { x: 100, y: 200, width: 200, height: 60 },
        timestamp: new Date(),
        imageUri: 'test-image-uri'
      }))
    }))
  }
}));

describe('ViolationService', () => {
  let violationService: ViolationService;

  beforeEach(() => {
    violationService = ViolationService.getInstance();
    jest.clearAllMocks();
  });

  describe('submitViolationReport', () => {
    it('should submit a violation report successfully', async () => {
      const reportData = {
        reportedBy: 'test-operator',
        vehiclePlateNumber: 'ABC 1234',
        violationType: 'illegal_parking' as const,
        description: 'Test violation',
        photos: ['data:image/jpeg;base64,test'],
        location: {
          latitude: 14.5995,
          longitude: 120.9842,
          address: 'Test Location'
        },
        priority: 'normal' as const,
        status: 'reported' as const,
      };

      const result = await violationService.submitViolationReport(reportData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-violation-id');
      expect(result.vehiclePlateNumber).toBe('ABC 1234');
      expect(result.violationType).toBe('illegal_parking');
    });

    it('should handle photo upload errors gracefully', async () => {
      // Mock storage upload to fail
      const mockStorage = require('@park-angel/shared/src/lib/supabase').supabase.storage;
      mockStorage.from().upload.mockResolvedValueOnce({
        data: null,
        error: new Error('Upload failed')
      });

      const reportData = {
        reportedBy: 'test-operator',
        vehiclePlateNumber: 'ABC 1234',
        violationType: 'illegal_parking' as const,
        description: 'Test violation',
        photos: ['data:image/jpeg;base64,test'],
        location: {
          latitude: 14.5995,
          longitude: 120.9842,
          address: 'Test Location'
        },
        priority: 'normal' as const,
        status: 'reported' as const,
      };

      // Should still succeed even if photo upload fails
      const result = await violationService.submitViolationReport(reportData);
      expect(result).toBeDefined();
    });
  });

  describe('getViolationReports', () => {
    it('should fetch violation reports with filters', async () => {
      const filters = {
        status: 'reported',
        violationType: 'illegal_parking',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31')
      };

      const result = await violationService.getViolationReports(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch all violation reports when no filters provided', async () => {
      const result = await violationService.getViolationReports();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateViolationReport', () => {
    it('should update violation report status', async () => {
      const updates = {
        status: 'resolved' as const,
        resolutionNotes: 'Issue resolved',
        resolvedAt: new Date()
      };

      const result = await violationService.updateViolationReport('test-violation-id', updates);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-violation-id');
    });
  });

  describe('requestEnforcementAction', () => {
    it('should request enforcement action successfully', async () => {
      const mockSupabase = require('@park-angel/shared/src/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-enforcement-id',
                violation_report_id: 'test-violation-id',
                action_type: 'towing',
                requested_by: 'test-operator',
                status: 'requested',
                priority: 'normal',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null
            }))
          }))
        }))
      });

      const result = await violationService.requestEnforcementAction(
        'test-violation-id',
        'towing',
        'test-operator',
        {
          priority: 'normal',
          estimatedCost: 1000,
          notes: 'Urgent towing required'
        }
      );

      expect(result).toBeDefined();
      expect(result.actionType).toBe('towing');
      expect(result.status).toBe('requested');
    });
  });

  describe('getViolationMonitoringSummary', () => {
    it('should fetch monitoring summary data', async () => {
      const mockSupabase = require('@park-angel/shared/src/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => Promise.resolve({
                  data: [{
                    id: 'test-summary-id',
                    location_id: 'test-location',
                    operator_id: 'test-operator',
                    report_date: '2024-01-01',
                    total_violations_reported: 5,
                    violations_by_type: { illegal_parking: 3, expired_session: 2 },
                    total_enforcement_actions: 2,
                    enforcement_by_type: { towing: 1, warning: 1 },
                    total_fines_issued: 500,
                    total_enforcement_costs: 1000,
                  }],
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      const result = await violationService.getViolationMonitoringSummary(
        'test-location',
        'test-operator',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].totalViolationsReported).toBe(5);
    });
  });

  describe('getServiceProviders', () => {
    it('should fetch active service providers', async () => {
      const mockSupabase = require('@park-angel/shared/src/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [{
                id: 'provider-1',
                name: 'Test Towing Service',
                service_type: 'towing',
                is_active: true,
                rating: 4.5
              }],
              error: null
            }))
          }))
        }))
      });

      const result = await violationService.getServiceProviders('towing');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('Test Towing Service');
    });
  });
});