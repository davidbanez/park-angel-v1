import type { CustomerProfile, VIPAssignment, VIPType, CustomerSupportConversation, CustomerSupportMessage, CustomerAnalytics } from '../types/user';
export declare class CustomerManagementService {
    getCustomers(_operatorId: string, filters?: {
        search?: string;
        status?: string;
        vipType?: VIPType;
        limit?: number;
        offset?: number;
    }): Promise<{
        customers: CustomerProfile[];
        total: number;
    }>;
    getCustomerById(customerId: string): Promise<CustomerProfile | null>;
    updateCustomerStatus(customerId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void>;
    assignVIP(vipAssignment: Omit<VIPAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<VIPAssignment>;
    updateVIPAssignment(vipId: string, updates: Partial<VIPAssignment>): Promise<void>;
    removeVIPAssignment(vipId: string): Promise<void>;
    createSupportConversation(conversation: Omit<CustomerSupportConversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerSupportConversation>;
    getSupportConversations(operatorId: string, customerId?: string): Promise<CustomerSupportConversation[]>;
    addSupportMessage(message: Omit<CustomerSupportMessage, 'id' | 'createdAt'>): Promise<CustomerSupportMessage>;
    updateConversationStatus(conversationId: string, status: CustomerSupportConversation['status']): Promise<void>;
    getCustomerAnalytics(operatorId: string, customerId?: string): Promise<CustomerAnalytics[]>;
}
export declare const customerManagementService: CustomerManagementService;
