/**
 * @jest-environment node
 */

import { POST, GET } from '../checkout/route'
import { NextRequest } from 'next/server'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn()
      }
    }
  }))
})

describe('/api/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
  })

  describe('GET /api/checkout', () => {
    it('should return available subscription plans', async () => {
      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('plans')
      expect(Array.isArray(data.plans)).toBe(true)
      expect(data.plans).toHaveLength(3)
      
      // Check plan structure
      const freePlan = data.plans.find((p: any) => p.id === 'free')
      expect(freePlan).toMatchObject({
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'forever'
      })

      const premiumPlan = data.plans.find((p: any) => p.id === 'premium')
      expect(premiumPlan).toMatchObject({
        id: 'premium',
        name: 'Premium',
        price: 15,
        currency: 'GBP',
        interval: 'month',
        popular: true
      })
    })
  })

  describe('POST /api/checkout', () => {
    it('should create a Stripe checkout session for premium plan', async () => {
      // Arrange
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      }

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

      const requestBody = {
        priceId: 'price_premium_monthly',
        userId: 'user-123',
        userEmail: 'test@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessionId', 'cs_test_123')
      expect(data).toHaveProperty('url', 'https://checkout.stripe.com/pay/cs_test_123')
      
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_premium_monthly',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: expect.stringContaining('/settings?success=true'),
        cancel_url: expect.stringContaining('/pricing?canceled=true'),
        customer_email: 'test@example.com',
        metadata: {
          userId: 'user-123',
          plan: 'premium'
        },
      })
    })

    it('should create a Stripe checkout session for VIP plan', async () => {
      // Arrange
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      const mockSession = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456'
      }

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

      const requestBody = {
        priceId: 'price_vip_monthly',
        userId: 'user-456',
        userEmail: 'vip@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessionId', 'cs_test_456')
      expect(data).toHaveProperty('url', 'https://checkout.stripe.com/pay/cs_test_456')
      
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-456',
            plan: 'vip'
          }
        })
      )
    })

    it('should validate required fields', async () => {
      // Arrange
      const requestBody = {
        priceId: 'price_premium_monthly',
        // Missing userId and userEmail
      }

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Missing required fields')
    })

    it('should validate price ID', async () => {
      // Arrange
      const requestBody = {
        priceId: 'invalid_price_id',
        userId: 'user-123',
        userEmail: 'test@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid price ID')
    })

    it('should handle Stripe errors', async () => {
      // Arrange
      const Stripe = require('stripe')
      const mockStripe = new Stripe()
      
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Your card was declined')
      )

      const requestBody = {
        priceId: 'price_premium_monthly',
        userId: 'user-123',
        userEmail: 'test@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to create checkout session')
    })

    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to create checkout session')
    })
  })
})
