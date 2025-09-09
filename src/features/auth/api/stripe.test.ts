import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>

// Mock Supabase - simplified for now
const mockUpdate = jest.fn()
jest.mock('@/lib/supabaseClient', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null })
        })
      })
    }))
  }))
}))

describe('/api/webhooks/stripe', () => {
  let mockStripeInstance: jest.Mocked<Stripe>
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockStripeInstance = {
      webhooks: {
        constructEvent: jest.fn()
      }
    } as any
    MockedStripe.mockImplementation(() => mockStripeInstance)
  })

  describe('POST', () => {
    it('should handle checkout.session.completed event for premium subscription', async () => {
      // Arrange
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            client_reference_id: 'user_123',
            mode: 'subscription',
            metadata: {
              userId: 'user_123'
            },
            subscription: 'sub_123'
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_tier: 'premium',
        stripe_subscription_id: 'sub_123',
        subscription_status: 'active'
      })
    })

    it('should handle checkout.session.completed event for VIP subscription', async () => {
      // Arrange
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_456',
            client_reference_id: 'user_456',
            mode: 'subscription',
            metadata: {
              userId: 'user_456',
              plan: 'vip'
            },
            subscription: 'sub_456'
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_tier: 'vip',
        stripe_subscription_id: 'sub_456',
        subscription_status: 'active'
      })
    })

    it('should handle checkout.session.completed event for lifetime payment', async () => {
      // Arrange
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_lifetime',
            client_reference_id: 'user_lifetime',
            mode: 'payment',
            metadata: {
              userId: 'user_lifetime',
              plan: 'lifetime'
            }
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_tier: 'lifetime',
        subscription_status: 'active'
      })
    })

    it('should handle invoice.payment_succeeded event', async () => {
      // Arrange
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub_123',
            customer: 'cus_123',
            metadata: {
              userId: 'user_123'
            }
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: 'active'
      })
    })

    it('should handle invoice.payment_failed event', async () => {
      // Arrange
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_123',
            customer: 'cus_123',
            metadata: {
              userId: 'user_123'
            }
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: 'past_due'
      })
    })

    it('should handle customer.subscription.deleted event', async () => {
      // Arrange
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            metadata: {
              userId: 'user_123'
            }
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        stripe_subscription_id: null
      })
    })

    it('should return 400 for invalid webhook signature', async () => {
      // Arrange
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'invalid_signature'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid signature')
    })

    it('should return 200 for unhandled event types', async () => {
      // Arrange
      const mockEvent = {
        type: 'unhandled.event',
        data: {
          object: {}
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe('Unhandled event type: unhandled.event')
    })

    it('should handle database update errors', async () => {
      // Arrange
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' } 
          })
        })
      })

      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            client_reference_id: 'user_123',
            mode: 'subscription',
            metadata: {
              userId: 'user_123'
            },
            subscription: 'sub_123'
          }
        }
      }
      
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test_signature'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Database update failed')
    })
  })
})
