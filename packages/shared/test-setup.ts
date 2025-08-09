import { vi, beforeEach } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});