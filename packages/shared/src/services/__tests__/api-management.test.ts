import { describe, it, expect, vi } from 'vitest';

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

// Create a simple test that focuses on utility methods that don't require database access
describe('APIManagementService Utility Methods', () => {
  // Import the service dynamically to avoid mocking issues
  let APIManagementService: any;

  beforeAll(async () => {
    // Mock the supabase import to avoid database dependencies
    vi.doMock('../../config/supabase', () => ({
      supabase: {
        from: vi.fn(),
        auth: { getUser: vi.fn() },
        rpc: vi.fn()
      }
    }));

    const module = await import('../api-management');
    APIManagementService = module.APIManagementService;
  });

  describe('API Key Validation', () => {
    it('should validate correct API key format', () => {
      const service = new APIManagementService();
      const validKey = 'pk_' + 'a'.repeat(64);
      expect(service.validateAPIKey(validKey)).toBe(true);
    });

    it('should reject invalid API key formats', () => {
      const service = new APIManagementService();
      expect(service.validateAPIKey('invalid-key')).toBe(false);
      expect(service.validateAPIKey('pk_short')).toBe(false);
      expect(service.validateAPIKey('')).toBe(false);
      expect(service.validateAPIKey('sk_' + 'a'.repeat(64))).toBe(false); // wrong prefix
    });
  });

  describe('Auth Header Extraction', () => {
    it('should extract API key from valid Bearer token', () => {
      const service = new APIManagementService();
      expect(service.extractAPIKey('Bearer pk_test123')).toBe('pk_test123');
      expect(service.extractAPIKey('Bearer sk_secret456')).toBe('sk_secret456');
    });

    it('should return null for invalid auth headers', () => {
      const service = new APIManagementService();
      expect(service.extractAPIKey('Invalid header')).toBe(null);
      expect(service.extractAPIKey('')).toBe(null);
      expect(service.extractAPIKey('Basic dGVzdA==')).toBe(null);
      expect(service.extractAPIKey('Bearer ')).toBe(''); // Edge case: Bearer with empty token
    });
  });

  describe('Key Generation', () => {
    it('should generate API keys with correct format', () => {
      const service = new APIManagementService();
      
      // Access private method through bracket notation for testing
      const generateAPIKey = service['generateAPIKey'].bind(service);
      const apiKey = generateAPIKey();
      
      expect(apiKey).toMatch(/^pk_[a-f0-9]{64}$/);
      expect(service.validateAPIKey(apiKey)).toBe(true);
    });

    it('should generate API secrets with correct format', () => {
      const service = new APIManagementService();
      
      // Access private method through bracket notation for testing
      const generateAPISecret = service['generateAPISecret'].bind(service);
      const apiSecret = generateAPISecret();
      
      expect(apiSecret).toMatch(/^sk_[a-f0-9]{64}$/);
      expect(apiSecret.length).toBe(67); // 'sk_' + 64 hex chars
    });

    it('should generate unique keys', () => {
      const service = new APIManagementService();
      
      const generateAPIKey = service['generateAPIKey'].bind(service);
      const key1 = generateAPIKey();
      const key2 = generateAPIKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});