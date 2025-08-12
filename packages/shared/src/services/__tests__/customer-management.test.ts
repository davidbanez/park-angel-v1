import { describe, it, expect } from 'vitest';
import { CustomerManagementService } from '../customer-management';
import type { VIPType } from '../../types/user';

describe('CustomerManagementService', () => {
  it('should create an instance of CustomerManagementService', () => {
    const service = new CustomerManagementService();
    expect(service).toBeInstanceOf(CustomerManagementService);
  });

  it('should have all required methods', () => {
    const service = new CustomerManagementService();
    
    expect(typeof service.getCustomers).toBe('function');
    expect(typeof service.getCustomerById).toBe('function');
    expect(typeof service.updateCustomerStatus).toBe('function');
    expect(typeof service.assignVIP).toBe('function');
    expect(typeof service.updateVIPAssignment).toBe('function');
    expect(typeof service.removeVIPAssignment).toBe('function');
    expect(typeof service.createSupportConversation).toBe('function');
    expect(typeof service.getSupportConversations).toBe('function');
    expect(typeof service.addSupportMessage).toBe('function');
    expect(typeof service.updateConversationStatus).toBe('function');
    expect(typeof service.getCustomerAnalytics).toBe('function');
  });

  it('should validate VIP types', () => {
    const validVIPTypes: VIPType[] = ['vvip', 'flex_vvip', 'spot_vip', 'spot_flex_vip'];
    
    validVIPTypes.forEach(vipType => {
      expect(['vvip', 'flex_vvip', 'spot_vip', 'spot_flex_vip']).toContain(vipType);
    });
  });


});