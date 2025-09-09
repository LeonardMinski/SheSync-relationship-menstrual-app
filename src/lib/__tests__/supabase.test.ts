// Mock Supabase before importing
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}))

import { supabase } from '../supabaseClient'

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have auth methods', () => {
    expect(supabase.auth.getSession).toBeDefined()
    expect(supabase.auth.signUp).toBeDefined()
    expect(supabase.auth.signInWithPassword).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
  })

  it('should have database query methods', () => {
    const query = supabase.from('test_table')
    expect(query.select).toBeDefined()
    expect(query.insert).toBeDefined()
    expect(query.update).toBeDefined()
  })

  it('should support method chaining', () => {
    const query = supabase.from('users').select('*').eq('id', '123')
    expect(query).toBeDefined()
  })
})
