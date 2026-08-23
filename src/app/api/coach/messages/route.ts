import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api/authentication'

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase')
    const limit = searchParams.get('limit') || '50'

    let query = supabase
      .from('ai_coach_messages')
      .select('*')
      .eq('user_id', user.id)

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
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { messageData } = await request.json()

    if (!messageData) {
      return NextResponse.json(
        { error: 'Message data is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ai_coach_messages')
      .insert({
        user_id: user.id,
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
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ai_coach_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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
