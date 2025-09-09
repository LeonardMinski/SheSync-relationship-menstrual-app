// Simple test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔗 Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('🔑 Supabase Anon Key:', supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Environment variables not loaded properly');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test authentication
    console.log('🧪 Testing signup...');
    const testEmail = `test+${Date.now()}@example.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error.message);
      return;
    }
    
    console.log('✅ Signup successful!');
    console.log('👤 User created:', data.user ? 'Yes' : 'No');
    console.log('📧 User ID:', data.user?.id);
    console.log('📧 User Email:', data.user?.email);
    console.log('✉️  Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    
    if (data.user) {
      // Test profile creation
      console.log('🧪 Testing profile creation...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: 'Test User',
          subscription_tier: 'free',
          privacy_settings: {
            share_with_partner: false,
            share_cycle_phase: true,
            share_mood: true,
            share_fantasy_vault: false,
            share_intimacy_deck: false,
          }
        })
        .select()
        .single();
        
      if (profileError) {
        console.error('❌ Profile creation error:', profileError.message);
      } else {
        console.log('✅ Profile created successfully!');
        console.log('👤 Profile data:', profileData);
      }
    }
    
  } catch (error) {
    console.error('💥 Connection error:', error.message);
  }
}

testSupabaseConnection();

