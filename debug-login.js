// Simple test script to debug login issues
const { createClient } = require('@supabase/supabase-js')

// Load environment variables (you'll need to check your actual .env.local values)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wuvjrpgoqrpaogpewlyj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseKey.length)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  try {
    console.log('\n🔍 Testing login with test credentials...')
    
    // Test with a known user (replace with actual test credentials)
    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with actual test email
      password: 'testpassword123' // Replace with actual test password
    })
    
    console.log('Login result:', result)
    
    if (result.error) {
      console.error('❌ Login error:', result.error.message)
    } else {
      console.log('✅ Login successful!')
      console.log('User:', result.data.user?.email)
      console.log('Session:', result.data.session ? 'Present' : 'Missing')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function testConnection() {
  try {
    console.log('\n🔍 Testing basic Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection error:', error.message)
    } else {
      console.log('✅ Database connection successful!')
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

// Run tests
testConnection().then(() => testLogin())
