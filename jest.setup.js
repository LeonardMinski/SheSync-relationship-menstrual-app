// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key'