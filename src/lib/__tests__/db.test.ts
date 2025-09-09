import { auth, cycles } from '../db'
import { supabase } from '../supabaseClient'

// Mock the supabase client
jest.mock('../supabaseClient')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('auth.getCurrentUser', () => {
    it('should return user when session exists', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription_tier: 'free' as const,
        created_at: '2024-01-01T00:00:00Z',
        privacy_settings: {
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' }
          }
        },
        error: null
      } as any)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      } as any)

      // Act
      const result = await auth.getCurrentUser()

      // Assert
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    it('should return null user when no session exists', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      } as any)

      // Act
      const result = await auth.getCurrentUser()

      // Assert
      expect(result.user).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should handle session errors gracefully', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      } as any)

      // Act
      const result = await auth.getCurrentUser()

      // Assert
      expect(result.user).toBeNull()
      expect(result.error).toBe('Session error')
    })
  })

  describe('auth.signUp', () => {
    it('should successfully create a new user', async () => {
      // Arrange
      const signUpData = {
        email: 'newuser@example.com',
        password: 'securepassword',
        name: 'New User'
      }

      const mockAuthUser = {
        id: 'new-user-123',
        email: 'newuser@example.com'
      }

      const expectedUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        subscription_tier: 'free',
        created_at: expect.any(String),
        privacy_settings: {
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      } as any)

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: null
        })
      } as any)

      // Act
      const result = await auth.signUp(signUpData)

      // Assert
      expect(result.user).toMatchObject(expectedUser)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: { name: signUpData.name }
        }
      })
    })

    it('should handle signup errors', async () => {
      // Arrange
      const signUpData = {
        email: 'invalid@example.com',
        password: 'weak',
        name: 'Test User'
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password too weak' }
      } as any)

      // Act
      const result = await auth.signUp(signUpData)

      // Assert
      expect(result.user).toBeNull()
      expect(result.error).toBe('Password too weak')
    })
  })

  describe('auth.signIn', () => {
    it('should successfully sign in a user', async () => {
      // Arrange
      const signInData = {
        email: 'user@example.com',
        password: 'password123'
      }

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Existing User',
        subscription_tier: 'premium',
        created_at: '2024-01-01T00:00:00Z',
        privacy_settings: {
          share_with_partner: true,
          share_cycle_phase: true,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      } as any)

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      } as any)

      // Act
      const result = await auth.signIn(signInData)

      // Assert
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith(signInData)
    })

    it('should handle invalid credentials', async () => {
      // Arrange
      const signInData = {
        email: 'user@example.com',
        password: 'wrongpassword'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      } as any)

      // Act
      const result = await auth.signIn(signInData)

      // Assert
      expect(result.user).toBeNull()
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('auth.signOut', () => {
    it('should successfully sign out', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      // Act
      const result = await auth.signOut()

      // Assert
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle signout errors', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Signout failed' }
      })

      // Act
      const result = await auth.signOut()

      // Assert
      expect(result.error).toBe('Signout failed')
    })
  })

  describe('cycles.create', () => {
    it('should create a new cycle entry', async () => {
      // Arrange
      const cycleData = {
        user_id: 'user-123',
        phase: 'menstrual' as const,
        mood: 7,
        symptoms: ['cramps', 'fatigue']
      }

      const mockCycle = {
        id: 'cycle-123',
        user_id: 'user-123',
        date: '2024-01-01',
        phase: 'menstrual',
        mood: 7,
        energy: 5,
        libido: 5,
        stress: 5,
        symptoms: ['cramps', 'fatigue'],
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCycle,
              error: null
            })
          })
        })
      } as any)

      // Act
      const result = await cycles.create(cycleData)

      // Assert
      expect(result.cycle).toEqual(mockCycle)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('cycle_data')
    })

    it('should handle database errors when creating cycle', async () => {
      // Arrange
      const cycleData = {
        user_id: 'user-123',
        phase: 'menstrual' as const,
        mood: 7,
        symptoms: ['cramps']
      }

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any)

      // Act
      const result = await cycles.create(cycleData)

      // Assert
      expect(result.cycle).toBeNull()
      expect(result.error).toBe('Database error')
    })
  })

  describe('cycles.getByUserId', () => {
    it('should retrieve cycles for a user', async () => {
      // Arrange
      const userId = 'user-123'
      const mockCycles = [
        {
          id: 'cycle-1',
          user_id: 'user-123',
          date: '2024-01-01',
          phase: 'menstrual',
          mood: 7
        },
        {
          id: 'cycle-2',
          user_id: 'user-123',
          date: '2024-01-02',
          phase: 'follicular',
          mood: 8
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockCycles,
              error: null
            })
          })
        })
      } as any)

      // Act
      const result = await cycles.getByUserId(userId)

      // Assert
      expect(result.cycles).toEqual(mockCycles)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('cycle_data')
    })

    it('should handle errors when retrieving cycles', async () => {
      // Arrange
      const userId = 'user-123'

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Access denied' }
            })
          })
        })
      } as any)

      // Act
      const result = await cycles.getByUserId(userId)

      // Assert
      expect(result.cycles).toBeNull()
      expect(result.error).toBe('Access denied')
    })
  })
})
