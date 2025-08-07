// Simple test to check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing'
);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log(
  'SUPABASE_ANON_KEY:',
  process.env.SUPABASE_ANON_KEY ? 'Found' : 'Missing'
);
