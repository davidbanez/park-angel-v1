import { apiManagementService } from '@park-angel/shared';
import type {
    DeveloperAccount,
    APIApplication,
    APIKey,
    APIPricingPlan,
    APISubscription,
    APIUsageAnalytics,
    APIRevenueAnalytics,
    DeveloperPortalStats,
    CreateDeveloperAccountRequest,
    CreateAPIApplicationRequest,
    CreateAPIKeyRequest,
    UpdateAPIKeyRequest,
    DeveloperAccountFilter,
    APIApplicationFilter,
    APIUsageFilter
} from '@park-angel/shared';

export class AdminAPIManagementService {
    // Developer Account Management
    async getDeveloperAccounts(filter?: DeveloperAccountFilter): Promise<DeveloperAccount[]> {
        return apiManagementService.getDeveloperAccounts(filter);
    }

    async getDeveloperAccount(id: string): Promise<DeveloperAccount | null> {
        return apiManagementService.getDeveloperAccount(id);
    }

    async approveDeveloperAccount(id: string, approvedBy: string): Promise<DeveloperAccount> {
        return apiManagementService.updateDeveloperAccountStatus(id, 'approved', approvedBy);
    }

    async rejectDeveloperAccount(id: string, approvedBy: string): Promise<DeveloperAccount> {
        return apiManagementService.updateDeveloperAccountStatus(id, 'rejected', approvedBy);
    }

    async suspendDeveloperAccount(id: string, approvedBy: string): Promise<DeveloperAccount> {
        return apiManagementService.updateDeveloperAccountStatus(id, 'suspended', approvedBy);
    }

    // API Application Management
    async getAPIApplications(filter?: APIApplicationFilter): Promise<APIApplication[]> {
        return apiManagementService.getAPIApplications(filter);
    }

    async getAPIApplication(id: string): Promise<APIApplication | null> {
        return apiManagementService.getAPIApplication(id);
    }

    async createAPIApplication(developerAccountId: string, data: CreateAPIApplicationRequest): Promise<APIApplication> {
        return apiManagementService.createAPIApplication(developerAccountId, data);
    }

    async approveAPIApplication(id: string, approvedBy: string): Promise<APIApplication> {
        return apiManagementService.updateAPIApplicationStatus(id, 'approved', approvedBy);
    }

    async rejectAPIApplication(id: string, approvedBy: string): Promise<APIApplication> {
        return apiManagementService.updateAPIApplicationStatus(id, 'rejected', approvedBy);
    }

    async suspendAPIApplication(id: string, approvedBy: string): Promise<APIApplication> {
        return apiManagementService.updateAPIApplicationStatus(id, 'suspended', approvedBy);
    }

    // API Key Management
    async getAPIKeys(applicationId?: string): Promise<APIKey[]> {
        return apiManagementService.getAPIKeys(applicationId);
    }

    async getAPIKey(id: string): Promise<APIKey | null> {
        return apiManagementService.getAPIKey(id);
    }

    async createAPIKey(applicationId: string, data: CreateAPIKeyRequest): Promise<APIKey> {
        return apiManagementService.createAPIKey(applicationId, data);
    }

    async updateAPIKey(id: string, data: UpdateAPIKeyRequest): Promise<APIKey> {
        return apiManagementService.updateAPIKey(id, data);
    }

    async deleteAPIKey(id: string): Promise<void> {
        return apiManagementService.deleteAPIKey(id);
    }

    async rotateAPIKey(id: string): Promise<APIKey> {
        return apiManagementService.rotateAPIKey(id);
    }

    // Usage Analytics
    async getAPIUsageAnalytics(
        apiKeyId?: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<APIUsageAnalytics> {
        return apiManagementService.getAPIUsageAnalytics(apiKeyId, dateFrom, dateTo);
    }

    async getAPIUsage(filter?: APIUsageFilter) {
        return apiManagementService.getAPIUsage(filter);
    }

    // Pricing Plans
    async getPricingPlans(): Promise<APIPricingPlan[]> {
        return apiManagementService.getPricingPlans();
    }

    async createPricingPlan(plan: Omit<APIPricingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<APIPricingPlan> {
        return apiManagementService.createPricingPlan(plan);
    }

    async updatePricingPlan(id: string, updates: Partial<APIPricingPlan>): Promise<APIPricingPlan> {
        return apiManagementService.updatePricingPlan(id, updates);
    }

    // Subscriptions
    async getSubscriptions(applicationId?: string): Promise<APISubscription[]> {
        return apiManagementService.getSubscriptions(applicationId);
    }

    async createSubscription(applicationId: string, pricingPlanId: string): Promise<APISubscription> {
        return apiManagementService.createSubscription(applicationId, pricingPlanId);
    }

    // Documentation
    async getDocumentation() {
        return apiManagementService.getDocumentation();
    }

    async createDocumentation(doc: any) {
        return apiManagementService.createDocumentation(doc);
    }

    async updateDocumentation(id: string, updates: any) {
        return apiManagementService.updateDocumentation(id, updates);
    }

    // Dashboard Stats
    async getDeveloperPortalStats(): Promise<DeveloperPortalStats> {
        return apiManagementService.getDeveloperPortalStats();
    }

    // Revenue Analytics
    async getRevenueAnalytics(dateFrom?: string, dateTo?: string): Promise<APIRevenueAnalytics> {
        // This would be implemented based on billing records
        // For now, return mock data structure
        return {
            total_revenue: 0,
            revenue_by_plan: {},
            revenue_over_time: [],
            top_applications: []
        };
    }

    // Bulk operations
    async bulkApproveDeveloperAccounts(ids: string[], approvedBy: string): Promise<void> {
        await Promise.all(
            ids.map(id => this.approveDeveloperAccount(id, approvedBy))
        );
    }

    async bulkRejectDeveloperAccounts(ids: string[], approvedBy: string): Promise<void> {
        await Promise.all(
            ids.map(id => this.rejectDeveloperAccount(id, approvedBy))
        );
    }

    async bulkApproveAPIApplications(ids: string[], approvedBy: string): Promise<void> {
        await Promise.all(
            ids.map(id => this.approveAPIApplication(id, approvedBy))
        );
    }

    async bulkRejectAPIApplications(ids: string[], approvedBy: string): Promise<void> {
        await Promise.all(
            ids.map(id => this.rejectAPIApplication(id, approvedBy))
        );
    }

    // Search and filtering helpers
    async searchDeveloperAccounts(query: string): Promise<DeveloperAccount[]> {
        return this.getDeveloperAccounts({ search: query, limit: 50 });
    }

    async searchAPIApplications(query: string): Promise<APIApplication[]> {
        return this.getAPIApplications({ search: query, limit: 50 });
    }

    // Export data
    async exportDeveloperAccounts(filter?: DeveloperAccountFilter): Promise<any[]> {
        const accounts = await this.getDeveloperAccounts(filter);
        return accounts.map(account => ({
            'Company Name': account.company_name,
            'Contact Email': account.contact_email,
            'Contact Phone': account.contact_phone || '',
            'Website': account.website_url || '',
            'Status': account.status,
            'Created Date': new Date(account.created_at).toLocaleDateString(),
            'Approved Date': account.approved_at ? new Date(account.approved_at).toLocaleDateString() : ''
        }));
    }

    async exportAPIApplications(filter?: APIApplicationFilter): Promise<any[]> {
        const applications = await this.getAPIApplications(filter);
        return applications.map(app => ({
            'Application Name': app.name,
            'Company': app.developer_account?.company_name || '',
            'Type': app.app_type,
            'Status': app.status,
            'Created Date': new Date(app.created_at).toLocaleDateString(),
            'Approved Date': app.approved_at ? new Date(app.approved_at).toLocaleDateString() : ''
        }));
    }

    async exportAPIUsage(filter?: APIUsageFilter): Promise<any[]> {
        const usage = await this.getAPIUsage(filter);
        return usage.map((log: any) => ({
            'Endpoint': log.endpoint,
            'Method': log.method,
            'Status Code': log.status_code,
            'Response Time (ms)': log.response_time_ms || 0,
            'IP Address': log.ip_address || '',
            'Timestamp': new Date(log.created_at).toLocaleString(),
            'Error': log.error_message || ''
        }));
    }
}

export const adminAPIManagementService = new AdminAPIManagementService();