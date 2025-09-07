import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from '../page'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// Mock the AuthContext
jest.mock('@/context/AuthContext')

// Mock Next.js navigation
jest.mock('next/navigation')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('SignupPage', () => {
  const mockSignUp = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signUp: mockSignUp,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  it('should render signup form', () => {
    // Act
    render(<SignupPage />)

    // Assert
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    // Arrange
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ success: true })

    render(<SignupPage />)

    // Act
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'securepassword123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'securepassword123'
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('should display error message on signup failure', async () => {
    // Arrange
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ 
      success: false, 
      error: 'Email already exists' 
    })

    render(<SignupPage />)

    // Act
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should validate required fields', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<SignupPage />)

    // Act - Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    expect(mockSignUp).not.toHaveBeenCalled()
    
    // HTML5 validation should prevent form submission
    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('should validate email format', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<SignupPage />)

    // Act
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    expect(mockSignUp).not.toHaveBeenCalled()
    
    // HTML5 email validation should prevent submission
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('should show loading state during signup', async () => {
    // Arrange
    const user = userEvent.setup()
    let resolveSignUp: (value: any) => void
    const signUpPromise = new Promise(resolve => {
      resolveSignUp = resolve
    })
    
    mockSignUp.mockReturnValue(signUpPromise)

    render(<SignupPage />)

    // Act
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    await user.click(screen.getByRole('button', { name: /create account/i }))

    // Assert
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()

    // Cleanup
    resolveSignUp!({ success: true })
    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument()
    })
  })

  it('should redirect to login page when clicking sign in link', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<SignupPage />)

    // Act
    const signInLink = screen.getByText(/sign in/i)
    await user.click(signInLink)

    // Assert
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should handle password visibility toggle', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<SignupPage />)

    const passwordInput = screen.getByLabelText(/password/i)
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Act - Click show password button (if it exists)
    const showPasswordButton = screen.queryByRole('button', { name: /show password/i })
    if (showPasswordButton) {
      await user.click(showPasswordButton)
      
      // Assert
      expect(passwordInput).toHaveAttribute('type', 'text')
    }
  })

  it('should prevent double submission', async () => {
    // Arrange
    const user = userEvent.setup()
    mockSignUp.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    render(<SignupPage />)

    // Act
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Click twice rapidly
    await user.click(submitButton)
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1)
    })
  })

  it('should redirect authenticated users', () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription_tier: 'free',
        created_at: '2024-01-01T00:00:00Z',
        privacy_settings: {
          share_with_partner: false,
          share_cycle_phase: false,
          share_mood: false,
          share_fantasy_vault: false,
          share_intimacy_deck: false,
        }
      },
      loading: false,
      signUp: mockSignUp,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    // Act
    render(<SignupPage />)

    // Assert
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should show loading spinner when auth is loading', () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signUp: mockSignUp,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    })

    // Act
    render(<SignupPage />)

    // Assert
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
