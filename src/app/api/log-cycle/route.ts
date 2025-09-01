import { NextRequest, NextResponse } from 'next/server'
import { cycles } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { phase, mood, symptoms } = await request.json()

    // Validate required fields
    if (!phase || !mood) {
      return NextResponse.json(
        { error: 'Phase and mood are required' },
        { status: 400 }
      )
    }

    // Validate phase values
    const validPhases = ['menstrual', 'follicular', 'ovulation', 'luteal']
    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { error: 'Invalid phase. Must be one of: menstrual, follicular, ovulation, luteal' },
        { status: 400 }
      )
    }

    // Validate mood range (1-10)
    if (typeof mood !== 'number' || mood < 1 || mood > 10) {
      return NextResponse.json(
        { error: 'Mood must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    // Validate symptoms array if provided
    if (symptoms && (!Array.isArray(symptoms) || !symptoms.every(s => typeof s === 'string'))) {
      return NextResponse.json(
        { error: 'Symptoms must be an array of strings' },
        { status: 400 }
      )
    }

    // Get the authenticated user from the request
    // In a real app, you'd get this from the JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract user ID from the Bearer token
    // In production, you'd verify the JWT and extract the user ID
    const userId = authHeader.replace('Bearer ', '')

    // Insert the cycle entry
    const { cycle, error } = await cycles.create({
      user_id: userId,
      phase,
      mood,
      symptoms: symptoms || []
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save cycle entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cycle entry logged successfully',
      data: cycle
    })
  } catch (error) {
    console.error('Log cycle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract user ID from the Bearer token
    const userId = authHeader.replace('Bearer ', '')

    // Get cycle entries for the user
    const { cycles: cycleData, error } = await cycles.getByUserId(userId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cycle entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: cycleData })
  } catch (error) {
    console.error('Get cycles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
