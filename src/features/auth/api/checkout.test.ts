import { POST } from '@/app/api/checkout/route'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>

// Mock Supabase - simplified for now
jest.mock('@/lib/supabaseClient', () => ({
  createClient: jest.fn()
}))

describe('/api/checkout', () => {
  let mockStripeInstance: jest.Mocked<Stripe>
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockStripeInstance = {
      checkout: {
        sessions: {
          create: jest.fn()
        }
      }
    } as any
    MockedStripe.mockImplementation(() => mockStripeInstance)
  })

  describe('POST', () => {
    it('should create a checkout session for premium plan', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      }
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession as any)

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_premium_monthly',
          userId: 'user_123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.url).toBe(mockSession.url)
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_premium_monthly',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: expect.stringContaining('/dashboard?success=true'),
        cancel_url: expect.stringContaining('/pricing?canceled=true'),
        client_reference_id: 'user_123',
        metadata: {
          userId: 'user_123'
        }
      })
    })

    it('should create a checkout session for VIP plan', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456'
      }
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession as any)

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_vip_monthly',
          userId: 'user_456'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.url).toBe(mockSession.url)
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_vip_monthly',
              quantity: 1,
            },
          ],
          client_reference_id: 'user_456'
        })
      )
    })

    it('should create a one-time payment session for lifetime plan', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_lifetime',
        url: 'https://checkout.stripe.com/pay/cs_test_lifetime'
      }
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession as any)

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_lifetime',
          userId: 'user_lifetime'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment', // One-time payment for lifetime
          line_items: [
            {
              price: 'price_lifetime',
              quantity: 1,
            },
          ]
        })
      )
    })

    it('should return 400 for missing priceId', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user_123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Price ID and User ID are required')
    })

    it('should return 400 for missing userId', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_premium_monthly'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Price ID and User ID are required')
    })

    it('should handle Stripe errors', async () => {
      // Arrange
      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        new Error('Stripe error')
      )

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          priceId: 'price_premium_monthly',
          userId: 'user_123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
    })
  })
})
