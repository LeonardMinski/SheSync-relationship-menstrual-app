import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/context/AuthContext'
import SignupPage from '@/app/auth/signup/page'
import { supabase } from '@/lib/supabaseClient'

// Mock Supabase
jest.mock('@/lib/supabaseClient')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/auth/signup',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Signup Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock initial session check (no user logged in)
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    } as any)

    // Mock auth state change subscription
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    } as any)
  })

  it('should complete full signup flow successfully', async () => {
    // Arrange
    const user = userEvent.setup()
    
    const mockAuthUser = {
      id: 'new-user-123',
      email: 'newuser@example.com',
      user_metadata: { name: 'New User' }
    }

    const mockUserProfile = {
      id: 'new-user-123',
      email: 'newuser@example.com',
      name: 'New User',
      subscription_tier: 'free',
      created_at: '2024-01-01T00:00:00Z',
      privacy_settings: {
        share_with_partner: false,
        share_cycle_phase: false,
        share_mood: false,
        share_fantasy_vault: false,
        share_intimacy_deck: false,
      }
    }

    // Mock successful signup
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null
    } as any)

    // Mock profile creation
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUserProfile,
            error: null
          })
        })
      })
    } as any)

    // Act
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'New User')
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/password/i), 'securepassword123')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'securepassword123',
        options: {
          data: { name: 'New User' }
        }
      })
    })

    // Should create user profile
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    // Should redirect to home page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('should handle signup with existing email', async () => {
    // Arrange
    const user = userEvent.setup()
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' }
    } as any)

    // Act
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/name/i), 'Existing User')
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should handle profile creation failure gracefully', async () => {
    // Arrange
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const mockAuthUser = {
      id: 'new-user-123',
      email: 'newuser@example.com',
      user_metadata: { name: 'New User' }
    }

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockAuthUser },
      error: null
    } as any)

    // Mock profile creation failure
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ 
        error: { message: 'Profile creation failed' } 
      })
    } as any)

    // Act
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/name/i), 'New User')
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert - Should still redirect even if profile creation fails
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    expect(consoleSpy).toHaveBeenCalledWith('Error creating user profile:', expect.any(Object))
    consoleSpy.mockRestore()
  })

  it('should handle network errors during signup', async () => {
    // Arrange
    const user = userEvent.setup()
    
    mockSupabase.auth.signUp.mockRejectedValue(
      new Error('Network error')
    )

    // Act
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during signup process', async () => {
    // Arrange
    const user = userEvent.setup()
    
    // Create a promise we can control
    let resolveSignUp: (value: any) => void
    const signUpPromise = new Promise(resolve => {
      resolveSignUp = resolve
    })
    
    mockSupabase.auth.signUp.mockReturnValue(signUpPromise)

    // Act
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()

    // Resolve the signup
    resolveSignUp!({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })

    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument()
    })
  })

  it('should validate form fields before submission', async () => {
    // Arrange
    const user = userEvent.setup()
    
    render(
      <AuthProvider>
        <SignupPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    })

    // Act - Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert - Should not call Supabase if validation fails
    expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    
    // Form validation should prevent submission
    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i) 
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(nameInput).toBeInvalid()
    expect(emailInput).toBeInvalid()
    expect(passwordInput).toBeInvalid()
  })
})
