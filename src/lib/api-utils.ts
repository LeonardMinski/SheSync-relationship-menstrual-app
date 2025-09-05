import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
  }
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    // Get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.user_metadata?.name || 'User'
    }

    return authenticatedRequest
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({ 
    data, 
    message: message || 'Success',
    success: true 
  })
}

export function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString()
  }
  return date.toISOString()
}

export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

export function calculateCyclePhase(lastPeriodDate: Date, cycleLength: number = 28): string {
  const today = new Date()
  const daysSincePeriod = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24))
  const dayInCycle = daysSincePeriod % cycleLength

  if (dayInCycle < 5) return 'menstrual'
  if (dayInCycle < 11) return 'follicular'
  if (dayInCycle < 16) return 'ovulation'
  return 'luteal'
}

export function validateCycleData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.phase || !['menstrual', 'follicular', 'ovulation', 'luteal'].includes(data.phase)) {
    errors.push('Invalid cycle phase')
  }
  
  if (data.mood && (data.mood < 1 || data.mood > 10)) {
    errors.push('Mood must be between 1 and 10')
  }
  
  if (data.energy && (data.energy < 1 || data.energy > 10)) {
    errors.push('Energy must be between 1 and 10')
  }
  
  if (data.libido && (data.libido < 1 || data.libido > 10)) {
    errors.push('Libido must be between 1 and 10')
  }
  
  if (data.stress && (data.stress < 1 || data.stress > 10)) {
    errors.push('Stress must be between 1 and 10')
  }
  
  if (data.periodFlow && !['light', 'medium', 'heavy'].includes(data.periodFlow)) {
    errors.push('Invalid period flow')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
