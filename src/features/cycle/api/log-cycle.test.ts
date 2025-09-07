/**
 * @jest-environment node
 */

import { POST, GET } from '../log-cycle/route'
import { NextRequest } from 'next/server'
import { cycles } from '@/lib/db'

// Mock the db module
jest.mock('@/lib/db')

const mockCycles = cycles as jest.Mocked<typeof cycles>

describe('/api/log-cycle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/log-cycle', () => {
    it('should successfully create a cycle entry', async () => {
      // Arrange
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

      mockCycles.create.mockResolvedValue({
        cycle: mockCycle,
        error: null
      })

      const requestBody = {
        phase: 'menstrual',
        mood: 7,
        symptoms: ['cramps', 'fatigue']
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'Cycle entry logged successfully')
      expect(data).toHaveProperty('data', mockCycle)
      
      expect(mockCycles.create).toHaveBeenCalledWith({
        user_id: 'user-123',
        phase: 'menstrual',
        mood: 7,
        symptoms: ['cramps', 'fatigue']
      })
    })

    it('should validate required fields', async () => {
      // Arrange
      const requestBody = {
        phase: 'menstrual'
        // Missing mood
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Phase and mood are required')
    })

    it('should validate phase values', async () => {
      // Arrange
      const requestBody = {
        phase: 'invalid_phase',
        mood: 7
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid phase. Must be one of: menstrual, follicular, ovulation, luteal')
    })

    it('should validate mood range', async () => {
      // Arrange
      const requestBody = {
        phase: 'menstrual',
        mood: 15 // Invalid: should be 1-10
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Mood must be a number between 1 and 10')
    })

    it('should validate symptoms array', async () => {
      // Arrange
      const requestBody = {
        phase: 'menstrual',
        mood: 7,
        symptoms: ['valid_symptom', 123] // Invalid: should be all strings
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Symptoms must be an array of strings')
    })

    it('should require authorization header', async () => {
      // Arrange
      const requestBody = {
        phase: 'menstrual',
        mood: 7
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
          // Missing Authorization header
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authorization header required')
    })

    it('should handle database errors', async () => {
      // Arrange
      mockCycles.create.mockResolvedValue({
        cycle: null,
        error: 'Database connection failed'
      })

      const requestBody = {
        phase: 'menstrual',
        mood: 7
      }

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to save cycle entry')
    })
  })

  describe('GET /api/log-cycle', () => {
    it('should retrieve cycle entries for a user', async () => {
      // Arrange
      const mockCycleData = [
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

      mockCycles.getByUserId.mockResolvedValue({
        cycles: mockCycleData,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('data', mockCycleData)
      
      expect(mockCycles.getByUserId).toHaveBeenCalledWith('user-123')
    })

    it('should require authorization for GET requests', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'GET'
        // Missing Authorization header
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authorization header required')
    })

    it('should handle database errors when fetching cycles', async () => {
      // Arrange
      mockCycles.getByUserId.mockResolvedValue({
        cycles: null,
        error: 'Access denied'
      })

      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer user-123'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Failed to fetch cycle entries')
    })

    it('should handle malformed authorization header', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/log-cycle', {
        method: 'GET',
        headers: {
          'Authorization': 'InvalidFormat user-123'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error', 'Authorization header required')
    })
  })
})
