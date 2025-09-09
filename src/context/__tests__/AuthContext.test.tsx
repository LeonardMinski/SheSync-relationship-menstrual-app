import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { auth } from '@/lib/db'

// Mock the db module
jest.mock('@/lib/db')

const mockAuth = auth as jest.Mocked<typeof auth>

// Test component to access the auth context
const TestComponent = () => {
  const { user, loading, signUp, signIn, signOut, refreshUser } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <button onClick={() => signUp({ email: 'test@example.com', password: 'password', name: 'Test' })}>
        Sign Up
      </button>
      <button onClick={() => signIn({ email: 'test@example.com', password: 'password' })}>
        Sign In
      </button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={refreshUser}>Refresh User</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AuthProvider', () => {
    it('should provide initial loading state', () => {
      // Arrange
      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Assert
      expect(screen.getByTestId('loading')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
    })

    it('should load user on mount', async () => {
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

      mockAuth.getCurrentUser.mockResolvedValue({ user: mockUser, error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })
    })

    it('should handle errors during user loading', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: 'Session expired' })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      // Arrange
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
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

      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: null })
      mockAuth.signUp.mockResolvedValue({ user: mockUser, error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Sign Up').click()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('newuser@example.com')
      })

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        name: 'Test'
      })
    })

    it('should handle signup errors', async () => {
      // Arrange
      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: null })
      mockAuth.signUp.mockResolvedValue({ user: null, error: 'Email already exists' })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      let signUpResult: any
      await act(async () => {
        // We need to access the signUp result somehow
        const { signUp } = useAuth()
        signUpResult = await signUp({ email: 'test@example.com', password: 'password', name: 'Test' })
      })

      // Assert
      expect(mockAuth.signUp).toHaveBeenCalled()
      // The user should remain null after failed signup
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Existing User',
        subscription_tier: 'premium' as const,
        created_at: '2024-01-01T00:00:00Z',
        privacy_settings: {
          share_with_partner: true,
          share_cycle_phase: true,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      }

      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: null })
      mockAuth.signIn.mockResolvedValue({ user: mockUser, error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Sign In').click()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
      })

      expect(mockAuth.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
    })

    it('should handle signin errors', async () => {
      // Arrange
      mockAuth.getCurrentUser.mockResolvedValue({ user: null, error: null })
      mockAuth.signIn.mockResolvedValue({ user: null, error: 'Invalid credentials' })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      await act(async () => {
        screen.getByText('Sign In').click()
      })

      // Assert
      expect(mockAuth.signIn).toHaveBeenCalled()
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
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

      mockAuth.getCurrentUser.mockResolvedValue({ user: mockUser, error: null })
      mockAuth.signOut.mockResolvedValue({ error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
      })

      await act(async () => {
        screen.getByText('Sign Out').click()
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })

      expect(mockAuth.signOut).toHaveBeenCalled()
    })

    it('should handle signout errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
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

      mockAuth.getCurrentUser.mockResolvedValue({ user: mockUser, error: null })
      mockAuth.signOut.mockResolvedValue({ error: 'Signout failed' })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
      })

      await act(async () => {
        screen.getByText('Sign Out').click()
      })

      // Assert
      // User should still be signed out even if there's an error
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Signout error:', 'Signout failed')
      consoleSpy.mockRestore()
    })
  })

  describe('refreshUser', () => {
    it('should refresh user data', async () => {
      // Arrange
      const initialUser = {
        id: 'user-123',
        email: 'user@example.com',
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

      const updatedUser = {
        ...initialUser,
        subscription_tier: 'premium' as const,
        privacy_settings: {
          ...initialUser.privacy_settings,
          share_with_partner: true,
        }
      }

      mockAuth.getCurrentUser
        .mockResolvedValueOnce({ user: initialUser, error: null })
        .mockResolvedValueOnce({ user: updatedUser, error: null })

      // Act
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
      })

      await act(async () => {
        screen.getByText('Refresh User').click()
      })

      // Assert
      expect(mockAuth.getCurrentUser).toHaveBeenCalledTimes(2)
      // The user should still be displayed (we can't easily test the subscription tier change in this simple component)
      expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
    })
  })

  describe('error handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Arrange
      const TestComponentOutsideProvider = () => {
        useAuth() // This should throw
        return <div>Test</div>
      }

      // Act & Assert
      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')
    })
  })
})
