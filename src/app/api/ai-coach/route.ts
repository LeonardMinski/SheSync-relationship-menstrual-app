import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const phase = searchParams.get('phase')
    const limit = searchParams.get('limit') || '50'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('ai_coach_messages')
      .select('*')
      .eq('user_id', userId)

    if (phase) {
      query = query.eq('phase', phase)
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get AI coach messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, messageData } = await request.json()

    if (!userId || !messageData) {
      return NextResponse.json(
        { error: 'User ID and message data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ai_coach_messages')
      .insert({
        user_id: userId,
        question: messageData.question,
        response: messageData.response,
        phase: messageData.phase,
        relevant_data: messageData.relevantData || {},
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'AI coach message saved successfully',
      data 
    })
  } catch (error) {
    console.error('Save AI coach message error:', error)
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
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID and User ID are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ai_coach_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'AI coach message deleted successfully' })
  } catch (error) {
    console.error('Delete AI coach message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
