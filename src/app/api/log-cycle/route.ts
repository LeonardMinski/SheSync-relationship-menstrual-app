import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getAuthenticatedSupabaseClient(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { supabase: null, user: null, error: 'No authorization header' }
    }

    // Extract the token
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('Token verification failed:', error)
      return { supabase: null, user: null, error: error?.message || 'Invalid token' }
    }

    return { supabase, user, error: null }
  } catch (error) {
    console.error('Auth error:', error)
    return { supabase: null, user: null, error: 'Authentication failed' }
  }
}

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

    // Get the authenticated Supabase client and user
    const { supabase, user, error: authError } = await getAuthenticatedSupabaseClient(request)

    if (authError || !user || !supabase) {
      console.error('Auth error in log-cycle:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ API: User authenticated:', user.email, 'ID:', user.id)

    // Insert the cycle entry directly using the authenticated Supabase client
    const { data: cycle, error } = await supabase
      .from('cycle_data')
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0], // Current date
        phase,
        mood,
        energy: 5, // Default values
        libido: 5,
        stress: 5,
        symptoms: symptoms || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating cycle entry:', error)
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ API: Cycle entry created successfully')
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
    // Get the authenticated Supabase client and user
    const { supabase, user, error: authError } = await getAuthenticatedSupabaseClient(request)

    if (authError || !user || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get cycle entries for the user using the authenticated client
    const { data: cycleData, error } = await supabase
      .from('cycle_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

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