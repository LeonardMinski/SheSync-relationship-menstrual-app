import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'

const VALID_PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const
const VALID_PERIOD_FLOWS = ['light', 'medium', 'heavy'] as const

type CyclePhase = (typeof VALID_PHASES)[number]
type PeriodFlow = (typeof VALID_PERIOD_FLOWS)[number]

type SupabaseRouteError = {
  message?: string
  code?: string
  details?: string
  hint?: string
}

type CyclePayload = {
  date?: unknown
  phase?: unknown
  periodFlow?: unknown
  mood?: unknown
  energy?: unknown
  sleep?: unknown
  libido?: unknown
  stress?: unknown
  symptoms?: unknown
  notes?: unknown
  temperature?: unknown
  weight?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getCyclePayload(value: unknown): CyclePayload | null {
  if (!isRecord(value)) return null

  const wrappedPayload = value.cycleData
  if (wrappedPayload !== undefined) {
    return isRecord(wrappedPayload) ? wrappedPayload : null
  }

  return value
}

function validateScore(value: unknown, field: string): string | null {
  if (value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > 10) {
    return `${field} must be a number between 1 and 10`
  }
  return null
}

function validateMetric(value: unknown, field: string): string | null {
  if (value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return `${field} must be a finite number`
  }
  return null
}

function getCycleDate(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString().split('T')[0]
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  return null
}

function getOptionalCycleDate(value: unknown): string | undefined | null {
  if (value === undefined) return undefined
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  return null
}

function getPhase(value: unknown): CyclePhase | null {
  return typeof value === 'string' && VALID_PHASES.includes(value as CyclePhase)
    ? (value as CyclePhase)
    : null
}

function getOptionalPeriodFlow(value: unknown): PeriodFlow | undefined | null {
  if (value === undefined || value === null || value === '') return undefined
  return typeof value === 'string' && VALID_PERIOD_FLOWS.includes(value as PeriodFlow)
    ? (value as PeriodFlow)
    : null
}

function getOptionalNotes(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return null
  const trimmedNotes = value.trim()
  return trimmedNotes ? trimmedNotes : null
}

function getSymptoms(value: unknown): string[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((symptom) => typeof symptom === 'string')) {
    return null
  }
  return value
}

function cycleErrorResponse(action: string, error: SupabaseRouteError) {
  console.error(`[cycle] ${action}`, error)

  if (error.code === '42501') {
    return NextResponse.json(
      { error: 'Cycle data access denied by Supabase RLS policy' },
      { status: 403 },
    )
  }

  if (error.code === '42P01') {
    return NextResponse.json(
      { error: 'Cycle data table is missing. Run the Supabase database migrations.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      error: `Failed to ${action}: ${error.message || 'Unknown database error'}`,
      ...(process.env.NODE_ENV !== 'production'
        ? { code: error.code, details: error.details, hint: error.hint }
        : {}),
    },
    { status: 500 },
  )
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('cycle_data')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      return cycleErrorResponse('fetch cycle entries', error)
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[cycle] unexpected GET error', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching cycle entries' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = getCyclePayload(await request.json())
    if (!payload) {
      return NextResponse.json({ error: 'Cycle data is required' }, { status: 400 })
    }

    const phase = getPhase(payload.phase)
    if (!phase) {
      return NextResponse.json(
        { error: 'Invalid phase. Must be one of: menstrual, follicular, ovulation, luteal' },
        { status: 400 },
      )
    }

    const scoreError =
      validateScore(payload.mood, 'Mood') ||
      validateScore(payload.energy, 'Energy') ||
      validateScore(payload.sleep, 'Sleep') ||
      validateScore(payload.libido, 'Libido') ||
      validateScore(payload.stress, 'Stress')

    if (payload.mood === undefined || scoreError) {
      return NextResponse.json(
        { error: scoreError || 'Mood is required' },
        { status: 400 },
      )
    }

    const cycleDate = getCycleDate(payload.date)
    if (!cycleDate) {
      return NextResponse.json(
        { error: 'Date must use YYYY-MM-DD format' },
        { status: 400 },
      )
    }

    const periodFlow = getOptionalPeriodFlow(payload.periodFlow)
    if (periodFlow === null) {
      return NextResponse.json(
        { error: 'Period flow must be one of: light, medium, heavy' },
        { status: 400 },
      )
    }

    const symptoms = getSymptoms(payload.symptoms)
    if (!symptoms) {
      return NextResponse.json(
        { error: 'Symptoms must be an array of strings' },
        { status: 400 },
      )
    }

    const metricError =
      validateMetric(payload.temperature, 'Temperature') ||
      validateMetric(payload.weight, 'Weight')

    if (metricError) {
      return NextResponse.json({ error: metricError }, { status: 400 })
    }

    const entry = {
      user_id: user.id,
      date: cycleDate,
      phase,
      period_flow: periodFlow,
      mood: payload.mood,
      energy: payload.energy ?? 5,
      sleep: payload.sleep ?? 5,
      libido: payload.libido ?? 5,
      stress: payload.stress ?? 5,
      symptoms,
      notes: getOptionalNotes(payload.notes) ?? null,
      temperature: payload.temperature,
      weight: payload.weight,
    }

    const { data: cycle, error: saveError } = await supabase
      .from('cycle_data')
      .upsert(entry, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (saveError) {
      return cycleErrorResponse('save cycle entry', saveError)
    }

    return NextResponse.json({
      message: 'Cycle data saved successfully',
      data: cycle,
    })
  } catch (error) {
    console.error('[cycle] unexpected POST error', error)
    return NextResponse.json(
      { error: 'Internal server error while saving cycle entry' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    if (!isRecord(body) || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'ID and cycle data are required' },
        { status: 400 },
      )
    }

    const payload = getCyclePayload(body)
    if (!payload) {
      return NextResponse.json(
        { error: 'ID and cycle data are required' },
        { status: 400 },
      )
    }

    const updates: Record<string, unknown> = {}

    if (payload.date !== undefined) {
      const date = getOptionalCycleDate(payload.date)
      if (date === null) {
        return NextResponse.json(
          { error: 'Date must use YYYY-MM-DD format' },
          { status: 400 },
        )
      }
      updates.date = date
    }

    if (payload.phase !== undefined) {
      const phase = getPhase(payload.phase)
      if (!phase) {
        return NextResponse.json(
          { error: 'Invalid phase. Must be one of: menstrual, follicular, ovulation, luteal' },
          { status: 400 },
        )
      }
      updates.phase = phase
    }

    const scoreError =
      validateScore(payload.mood, 'Mood') ||
      validateScore(payload.energy, 'Energy') ||
      validateScore(payload.sleep, 'Sleep') ||
      validateScore(payload.libido, 'Libido') ||
      validateScore(payload.stress, 'Stress')

    if (scoreError) {
      return NextResponse.json({ error: scoreError }, { status: 400 })
    }

    if (payload.mood !== undefined) updates.mood = payload.mood
    if (payload.energy !== undefined) updates.energy = payload.energy
    if (payload.sleep !== undefined) updates.sleep = payload.sleep
    if (payload.libido !== undefined) updates.libido = payload.libido
    if (payload.stress !== undefined) updates.stress = payload.stress

    if (payload.periodFlow !== undefined) {
      const periodFlow = getOptionalPeriodFlow(payload.periodFlow)
      if (periodFlow === null) {
        return NextResponse.json(
          { error: 'Period flow must be one of: light, medium, heavy' },
          { status: 400 },
        )
      }
      updates.period_flow = periodFlow
    }

    if (payload.symptoms !== undefined) {
      const symptoms = getSymptoms(payload.symptoms)
      if (!symptoms) {
        return NextResponse.json(
          { error: 'Symptoms must be an array of strings' },
          { status: 400 },
        )
      }
      updates.symptoms = symptoms
    }

    if (payload.notes !== undefined) {
      const notes = getOptionalNotes(payload.notes)
      if (notes === undefined) {
        return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
      }
      updates.notes = notes
    }

    const metricError =
      validateMetric(payload.temperature, 'Temperature') ||
      validateMetric(payload.weight, 'Weight')

    if (metricError) {
      return NextResponse.json({ error: metricError }, { status: 400 })
    }

    if (payload.temperature !== undefined) updates.temperature = payload.temperature
    if (payload.weight !== undefined) updates.weight = payload.weight

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('cycle_data')
      .update(updates)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return cycleErrorResponse('update cycle entry', error)
    }

    return NextResponse.json({
      message: 'Cycle data updated successfully',
      data,
    })
  } catch (error) {
    console.error('[cycle] unexpected PUT error', error)
    return NextResponse.json(
      { error: 'Internal server error while updating cycle entry' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cycle_data')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return cycleErrorResponse('delete cycle entry', error)
    }

    return NextResponse.json({ message: 'Cycle data deleted successfully' })
  } catch (error) {
    console.error('[cycle] unexpected DELETE error', error)
    return NextResponse.json(
      { error: 'Internal server error while deleting cycle entry' },
      { status: 500 },
    )
  }
}
