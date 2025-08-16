import { supabase } from '@park-angel/shared/src/lib/supabase';
import { ViolationReport, EnforcementAction, ViolationMonitoringSummary } from '../types/pos';
import { LicensePlateService } from './licensePlateService';

export class ViolationService {
  private static instance: ViolationService;

  static getInstance(): ViolationService {
    if (!ViolationService.instance) {
      ViolationService.instance = new ViolationService();
    }
    return ViolationService.instance;
  }

  async submitViolationReport(report: Omit<ViolationReport, 'id' | 'timestamp'>): Promise<ViolationReport> {
    try {
      // Upload photos to Supabase Storage
      const photoUrls = await this.uploadViolationPhotos(report.photos);

      // Create violation report in database
      const { data, error } = await supabase
        .from('violation_reports')
        .insert({
          reported_by: report.reportedBy,
          vehicle_plate_number: report.vehiclePlateNumber,
          violation_type: report.violationType,
          description: report.description,
          location_id: report.locationId,
          spot_id: report.spotId,
          coordinates: report.location,
          photos: photoUrls,
          status: report.status || 'reported',
          priority: report.priority || 'normal',
          enforcement_action: report.enforcementAction,
          assigned_to: report.assignedTo,
          metadata: report.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Process AI license plate recognition if photos are available
      if (photoUrls.length > 0) {
        await this.processLicensePlateRecognition(data.id, photoUrls[0], report.vehiclePlateNumber);
      }

      return this.mapDatabaseToViolationReport(data);
    } catch (error) {
      console.error('Error submitting violation report:', error);
      throw error;
    }
  }

  async getViolationReports(filters?: {
    status?: string;
    violationType?: string;
    locationId?: string;
    reportedBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ViolationReport[]> {
    try {
      let query = supabase
        .from('violation_reports_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.violationType) {
          query = query.eq('violation_type', filters.violationType);
        }
        if (filters.locationId) {
          query = query.eq('location_id', filters.locationId);
        }
        if (filters.reportedBy) {
          query = query.eq('reported_by', filters.reportedBy);
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom.toISOString());
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo.toISOString());
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(this.mapDatabaseToViolationReport);
    } catch (error) {
      console.error('Error fetching violation reports:', error);
      throw error;
    }
  }

  async updateViolationReport(id: string, updates: Partial<ViolationReport>): Promise<ViolationReport> {
    try {
      const updateData: any = {};

      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.enforcementAction) updateData.enforcement_action = updates.enforcementAction;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.resolutionNotes) updateData.resolution_notes = updates.resolutionNotes;
      if (updates.resolvedAt) updateData.resolved_at = updates.resolvedAt.toISOString();
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('violation_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToViolationReport(data);
    } catch (error) {
      console.error('Error updating violation report:', error);
      throw error;
    }
  }

  async requestEnforcementAction(
    violationReportId: string,
    actionType: EnforcementAction['actionType'],
    requestedBy: string,
    options?: {
      priority?: EnforcementAction['priority'];
      serviceProvider?: string;
      scheduledTime?: Date;
      estimatedCost?: number;
      notes?: string;
    }
  ): Promise<EnforcementAction> {
    try {
      const { data, error } = await supabase
        .from('enforcement_actions')
        .insert({
          violation_report_id: violationReportId,
          action_type: actionType,
          requested_by: requestedBy,
          priority: options?.priority || 'normal',
          service_provider: options?.serviceProvider,
          scheduled_time: options?.scheduledTime?.toISOString(),
          estimated_cost: options?.estimatedCost,
          completion_notes: options?.notes,
          status: 'requested'
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToEnforcementAction(data);
    } catch (error) {
      console.error('Error requesting enforcement action:', error);
      throw error;
    }
  }

  async getEnforcementActions(filters?: {
    violationReportId?: string;
    actionType?: string;
    status?: string;
    assignedTo?: string;
    requestedBy?: string;
  }): Promise<EnforcementAction[]> {
    try {
      let query = supabase
        .from('enforcement_actions_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        if (filters.violationReportId) {
          query = query.eq('violation_report_id', filters.violationReportId);
        }
        if (filters.actionType) {
          query = query.eq('action_type', filters.actionType);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.assignedTo) {
          query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters.requestedBy) {
          query = query.eq('requested_by', filters.requestedBy);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(this.mapDatabaseToEnforcementAction);
    } catch (error) {
      console.error('Error fetching enforcement actions:', error);
      throw error;
    }
  }

  async updateEnforcementAction(id: string, updates: Partial<EnforcementAction>): Promise<EnforcementAction> {
    try {
      const updateData: any = {};

      if (updates.status) updateData.status = updates.status;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.actualCost) updateData.actual_cost = updates.actualCost;
      if (updates.startedAt) updateData.started_at = updates.startedAt.toISOString();
      if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();
      if (updates.completionPhotos) updateData.completion_photos = updates.completionPhotos;
      if (updates.completionNotes) updateData.completion_notes = updates.completionNotes;
      if (updates.customerNotified !== undefined) updateData.customer_notified = updates.customerNotified;
      if (updates.customerNotificationMethod) updateData.customer_notification_method = updates.customerNotificationMethod;
      if (updates.paymentStatus) updateData.payment_status = updates.paymentStatus;

      const { data, error } = await supabase
        .from('enforcement_actions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToEnforcementAction(data);
    } catch (error) {
      console.error('Error updating enforcement action:', error);
      throw error;
    }
  }

  async getViolationMonitoringSummary(
    locationId?: string,
    operatorId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ViolationMonitoringSummary[]> {
    try {
      let query = supabase
        .from('violation_monitoring_summaries')
        .select('*')
        .order('report_date', { ascending: false });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      if (operatorId) {
        query = query.eq('operator_id', operatorId);
      }
      if (dateFrom) {
        query = query.gte('report_date', dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        query = query.lte('report_date', dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(this.mapDatabaseToViolationSummary);
    } catch (error) {
      console.error('Error fetching violation monitoring summary:', error);
      throw error;
    }
  }

  async getViolationTrends(
    locationId?: string,
    operatorId?: string,
    days: number = 30
  ): Promise<{
    trends: ViolationMonitoringSummary[];
    analytics: {
      totalViolations: number;
      averageDaily: number;
      trendDirection: 'increasing' | 'decreasing' | 'stable';
      mostCommonType: string;
      peakDay: string;
      resolutionTrend: 'improving' | 'declining' | 'stable';
    };
  }> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const summaries = await this.getViolationMonitoringSummary(
        locationId,
        operatorId,
        dateFrom,
        new Date()
      );

      // Calculate analytics
      const totalViolations = summaries.reduce((sum, s) => sum + s.totalViolationsReported, 0);
      const averageDaily = totalViolations / Math.max(summaries.length, 1);

      // Determine trend direction
      const firstHalf = summaries.slice(Math.floor(summaries.length / 2));
      const secondHalf = summaries.slice(0, Math.floor(summaries.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.totalViolationsReported, 0) / Math.max(firstHalf.length, 1);
      const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.totalViolationsReported, 0) / Math.max(secondHalf.length, 1);
      
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const trendDiff = secondHalfAvg - firstHalfAvg;
      if (Math.abs(trendDiff) > averageDaily * 0.1) {
        trendDirection = trendDiff > 0 ? 'increasing' : 'decreasing';
      }

      // Find most common violation type
      const typeCount: Record<string, number> = {};
      summaries.forEach(summary => {
        Object.entries(summary.violationsByType).forEach(([type, count]) => {
          typeCount[type] = (typeCount[type] || 0) + count;
        });
      });
      const mostCommonType = Object.entries(typeCount).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];

      // Find peak day
      const peakSummary = summaries.reduce((peak, current) => 
        current.totalViolationsReported > peak.totalViolationsReported ? current : peak,
        summaries[0] || { totalViolationsReported: 0, reportDate: new Date() }
      );
      const peakDay = peakSummary.reportDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Calculate resolution trend
      const resolutionRates = summaries.filter(s => s.resolutionRate !== undefined).map(s => s.resolutionRate!);
      const firstHalfResolution = resolutionRates.slice(Math.floor(resolutionRates.length / 2));
      const secondHalfResolution = resolutionRates.slice(0, Math.floor(resolutionRates.length / 2));
      const firstResolutionAvg = firstHalfResolution.reduce((sum, r) => sum + r, 0) / Math.max(firstHalfResolution.length, 1);
      const secondResolutionAvg = secondHalfResolution.reduce((sum, r) => sum + r, 0) / Math.max(secondHalfResolution.length, 1);
      
      let resolutionTrend: 'improving' | 'declining' | 'stable' = 'stable';
      const resolutionDiff = secondResolutionAvg - firstResolutionAvg;
      if (Math.abs(resolutionDiff) > 5) { // 5% threshold
        resolutionTrend = resolutionDiff > 0 ? 'improving' : 'declining';
      }

      return {
        trends: summaries,
        analytics: {
          totalViolations,
          averageDaily: Math.round(averageDaily * 100) / 100,
          trendDirection,
          mostCommonType,
          peakDay,
          resolutionTrend,
        },
      };
    } catch (error) {
      console.error('Error fetching violation trends:', error);
      throw error;
    }
  }

  async submitBatchViolationReports(
    reports: Array<Omit<ViolationReport, 'id' | 'timestamp'>>
  ): Promise<ViolationReport[]> {
    const results: ViolationReport[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < reports.length; i++) {
      try {
        const result = await this.submitViolationReport(reports[i]);
        results.push(result);
      } catch (error: any) {
        console.error(`Error submitting batch report ${i}:`, error);
        errors.push({ index: i, error: error.message });
      }
    }

    if (errors.length > 0) {
      console.warn(`${errors.length} out of ${reports.length} reports failed to submit:`, errors);
    }

    return results;
  }

  async getServiceProviders(serviceType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('enforcement_service_providers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching service providers:', error);
      throw error;
    }
  }

  private async uploadViolationPhotos(photoUris: string[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const uri of photoUris) {
      try {
        // Convert URI to blob for upload
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const fileName = `violation_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `violations/${fileName}`;

        const { data, error } = await supabase.storage
          .from('violation-photos')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('violation-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Error uploading photo:', error);
        // Continue with other photos even if one fails
      }
    }

    return uploadedUrls;
  }

  private async processLicensePlateRecognition(
    violationReportId: string,
    imageUrl: string,
    reportedPlateNumber: string
  ): Promise<void> {
    try {
      // Use the license plate service to scan the image
      const recognition = await LicensePlateService.getInstance().scanLicensePlate(imageUrl);
      
      if (recognition) {
        await supabase
          .from('license_plate_recognitions')
          .insert({
            violation_report_id: violationReportId,
            image_url: imageUrl,
            detected_plate_number: recognition.plateNumber,
            confidence_score: recognition.confidence,
            bounding_box: recognition.boundingBox,
            processing_method: 'ai_custom', // or whatever method was used
            verified: recognition.plateNumber.toLowerCase() === reportedPlateNumber.toLowerCase()
          });
      }
    } catch (error) {
      console.error('Error processing license plate recognition:', error);
      // Don't throw error as this is optional functionality
    }
  }

  private mapDatabaseToViolationReport(data: any): ViolationReport {
    return {
      id: data.id,
      reportedBy: data.reported_by,
      vehiclePlateNumber: data.vehicle_plate_number,
      violationType: data.violation_type,
      description: data.description,
      photos: data.photos || [],
      location: data.coordinates || {},
      locationId: data.location_id,
      spotId: data.spot_id,
      status: data.status,
      priority: data.priority,
      timestamp: new Date(data.created_at),
      enforcementAction: data.enforcement_action,
      assignedTo: data.assigned_to,
      resolutionNotes: data.resolution_notes,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      metadata: data.metadata || {}
    };
  }

  private mapDatabaseToEnforcementAction(data: any): EnforcementAction {
    return {
      id: data.id,
      violationReportId: data.violation_report_id,
      actionType: data.action_type,
      requestedBy: data.requested_by,
      assignedTo: data.assigned_to,
      status: data.status,
      priority: data.priority,
      estimatedCost: data.estimated_cost,
      actualCost: data.actual_cost,
      serviceProvider: data.service_provider,
      serviceProviderContact: data.service_provider_contact,
      scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      completionPhotos: data.completion_photos || [],
      completionNotes: data.completion_notes,
      customerNotified: data.customer_notified || false,
      customerNotificationMethod: data.customer_notification_method,
      paymentStatus: data.payment_status || 'pending',
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDatabaseToViolationSummary(data: any): ViolationMonitoringSummary {
    return {
      id: data.id,
      locationId: data.location_id,
      operatorId: data.operator_id,
      reportDate: new Date(data.report_date),
      totalViolationsReported: data.total_violations_reported,
      violationsByType: data.violations_by_type || {},
      totalEnforcementActions: data.total_enforcement_actions,
      enforcementByType: data.enforcement_by_type || {},
      avgResponseTimeMinutes: data.avg_response_time_minutes,
      resolutionRate: data.resolution_rate,
      totalFinesIssued: data.total_fines_issued,
      totalEnforcementCosts: data.total_enforcement_costs,
      aiAccuracyRate: data.ai_accuracy_rate
    };
  }
}