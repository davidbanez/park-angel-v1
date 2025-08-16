import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { POSSession, POSTransaction, ViolationReport } from '../types/pos';
import { posAuthService } from '../services/posAuthService';
import { cashManagementService } from '../services/cashManagementService';
import { useAuth } from '../hooks/useAuth';

interface POSContextType {
  // Session Management
  currentSession: POSSession | null;
  isSessionActive: boolean;
  startSession: (params: {
    previousCashAmount: number;
    currentCashAmount: number;
    locationId: string;
    startTime: Date;
  }) => Promise<void>;
  endSession: (endCashAmount: number, notes?: string) => Promise<void>;
  
  // Transaction Management
  transactions: POSTransaction[];
  addTransaction: (transaction: Omit<POSTransaction, 'id' | 'timestamp'>) => Promise<void>;
  
  // Cash Management
  cashSummary: any;
  performCashCount: (params: {
    denominations: { [key: string]: number };
    totalAmount: number;
    notes?: string;
  }) => Promise<void>;
  makeCashAdjustment: (params: {
    amount: number;
    reason: string;
    type: 'add' | 'remove';
  }) => Promise<void>;
  recordCashDeposit: (params: {
    amount: number;
    reason: string;
    depositMethod: 'bank_deposit' | 'safe_deposit' | 'manager_pickup';
    referenceNumber?: string;
  }) => Promise<void>;
  
  // Violation Reporting
  violations: ViolationReport[];
  reportViolation: (violation: Omit<ViolationReport, 'id' | 'timestamp'>) => Promise<void>;
  
  // Reports
  generateShiftReport: () => Promise<any>;
  createCashRemittance: (params: {
    amount: number;
    depositMethod: 'bank_deposit' | 'cash_pickup' | 'digital_transfer';
    referenceNumber?: string;
    depositDate: Date;
    notes?: string;
  }) => Promise<void>;
  
  // Loading States
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

export const POSContext = createContext<POSContextType | undefined>(undefined);

interface POSProviderProps {
  children: ReactNode;
}

export function POSProvider({ children }: POSProviderProps) {
  const [currentSession, setCurrentSession] = useState<POSSession | null>(null);
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [violations, setViolations] = useState<ViolationReport[]>([]);
  const [cashSummary, setCashSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const isSessionActive = currentSession?.status === 'active';

  const startSession = async (params: {
    previousCashAmount: number;
    currentCashAmount: number;
    locationId: string;
    startTime: Date;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const newSession = await posAuthService.startShift(params);
      setCurrentSession(newSession);
      setTransactions([]);
      
      // Load initial cash summary
      if (newSession.id) {
        const summary = await cashManagementService.getCashSummary(newSession.id);
        setCashSummary(summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (endCashAmount: number, notes?: string) => {
    if (!currentSession) {
      throw new Error('No active session to end');
    }

    setLoading(true);
    setError(null);

    try {
      await posAuthService.endShift({
        sessionId: currentSession.id,
        endCashAmount,
        notes
      });
      
      // Update local session state
      setCurrentSession(prev => prev ? {
        ...prev,
        endTime: new Date(),
        endCashAmount,
        status: 'completed',
        notes,
      } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<POSTransaction, 'id' | 'timestamp'>) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      // This would be implemented in a separate transaction service
      // For now, we'll create a mock transaction
      const newTransaction: POSTransaction = {
        ...transaction,
        id: `trans_${Date.now()}`,
        timestamp: new Date(),
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Refresh cash summary after transaction
      const summary = await cashManagementService.getCashSummary(currentSession.id);
      setCashSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const performCashCount = async (params: {
    denominations: { [key: string]: number };
    totalAmount: number;
    notes?: string;
  }) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      await cashManagementService.performCashCount({
        sessionId: currentSession.id,
        ...params
      });
      
      // Refresh cash summary
      const summary = await cashManagementService.getCashSummary(currentSession.id);
      setCashSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to perform cash count');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const makeCashAdjustment = async (params: {
    amount: number;
    reason: string;
    type: 'add' | 'remove';
  }) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      await cashManagementService.makeCashAdjustment({
        sessionId: currentSession.id,
        ...params
      });
      
      // Refresh cash summary
      const summary = await cashManagementService.getCashSummary(currentSession.id);
      setCashSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to make cash adjustment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordCashDeposit = async (params: {
    amount: number;
    reason: string;
    depositMethod: 'bank_deposit' | 'safe_deposit' | 'manager_pickup';
    referenceNumber?: string;
  }) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      await cashManagementService.recordCashDeposit({
        sessionId: currentSession.id,
        ...params
      });
      
      // Refresh cash summary
      const summary = await cashManagementService.getCashSummary(currentSession.id);
      setCashSummary(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to record cash deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateShiftReport = async () => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    try {
      const report = await cashManagementService.generateCashReport(currentSession.id);
      return report;
    } catch (err: any) {
      setError(err.message || 'Failed to generate shift report');
      throw err;
    }
  };

  const createCashRemittance = async (params: {
    amount: number;
    depositMethod: 'bank_deposit' | 'cash_pickup' | 'digital_transfer';
    referenceNumber?: string;
    depositDate: Date;
    notes?: string;
  }) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setLoading(true);
    setError(null);

    try {
      await posAuthService.createCashRemittance({
        sessionId: currentSession.id,
        ...params
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create cash remittance');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reportViolation = async (violation: Omit<ViolationReport, 'id' | 'timestamp'>) => {
    setLoading(true);
    setError(null);

    try {
      // Mock implementation - replace with actual API call
      const newViolation: ViolationReport = {
        ...violation,
        id: `violation_${Date.now()}`,
        timestamp: new Date(),
      };
      
      setViolations(prev => [newViolation, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Failed to report violation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const session = await posAuthService.getCurrentSession();
      setCurrentSession(session);
      
      if (session?.id) {
        const summary = await cashManagementService.getCashSummary(session.id);
        setCashSummary(summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh session');
    } finally {
      setLoading(false);
    }
  };

  // Load existing session on mount
  useEffect(() => {
    if (user) {
      refreshSession();
    }
  }, [user]);

  const value: POSContextType = {
    currentSession,
    isSessionActive,
    startSession,
    endSession,
    transactions,
    addTransaction,
    cashSummary,
    performCashCount,
    makeCashAdjustment,
    recordCashDeposit,
    violations,
    reportViolation,
    generateShiftReport,
    createCashRemittance,
    loading,
    error,
    refreshSession,
  };

  return (
    <POSContext.Provider value={value}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}