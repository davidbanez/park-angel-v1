import { useContext } from 'react';
import { POSContext } from '../providers/POSProvider';

export function usePOSSession() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOSSession must be used within a POSProvider');
  }
  
  return {
    ...context,
    hasActiveSession: context.isSessionActive,
    startShift: context.startSession,
    endShift: context.endSession,
  };
}