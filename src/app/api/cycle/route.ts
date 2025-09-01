import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('cycle_data')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get cycle data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, cycleData } = await request.json()

    if (!userId || !cycleData) {
      return NextResponse.json(
        { error: 'User ID and cycle data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('cycle_data')
      .insert({
        user_id: userId,
        date: cycleData.date,
        phase: cycleData.phase,
        period_flow: cycleData.periodFlow,
        mood: cycleData.mood,
        energy: cycleData.energy,
        libido: cycleData.libido,
        stress: cycleData.stress,
        symptoms: cycleData.symptoms || [],
        notes: cycleData.notes,
        temperature: cycleData.temperature,
        weight: cycleData.weight,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Cycle data saved successfully',
      data 
    })
  } catch (error) {
    console.error('Save cycle data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, cycleData } = await request.json()

    if (!id || !cycleData) {
      return NextResponse.json(
        { error: 'ID and cycle data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('cycle_data')
      .update({
        date: cycleData.date,
        phase: cycleData.phase,
        period_flow: cycleData.periodFlow,
        mood: cycleData.mood,
        energy: cycleData.energy,
        libido: cycleData.libido,
        stress: cycleData.stress,
        symptoms: cycleData.symptoms || [],
        notes: cycleData.notes,
        temperature: cycleData.temperature,
        weight: cycleData.weight,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Cycle data updated successfully',
      data 
    })
  } catch (error) {
    console.error('Update cycle data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cycle_data')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Cycle data deleted successfully' })
  } catch (error) {
    console.error('Delete cycle data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
