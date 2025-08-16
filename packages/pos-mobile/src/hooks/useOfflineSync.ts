import { useContext } from 'react';
import { OfflineContext } from '../providers/OfflineProvider';

export function useOfflineSync() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOfflineSync must be used within an OfflineProvider');
  }
  return context;
}