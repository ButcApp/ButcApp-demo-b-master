import { createClient } from '@supabase/supabase-js';

// Environment variables from .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export supabase client
export { supabase };

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('✓ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return false;
  }
};

// Initialize connection on module load in development
if (process.env.NODE_ENV !== 'production') {
  testConnection().catch(console.error);
}