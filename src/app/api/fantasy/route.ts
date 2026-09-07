import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, requireTrackingEnabled } from '@/lib/api/authentication'

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const trackingBlocked = requireTrackingEnabled(user)
    if (trackingBlocked) return trackingBlocked

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const isShared = searchParams.get('isShared')

    let query = supabase
      .from('fantasy_entries')
      .select('*')
      .eq('user_id', user.id)

    if (type) {
      query = query.eq('type', type)
    }

    if (isShared !== null) {
      query = query.eq('is_shared_with_partner', isShared === 'true')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get fantasy entries error:', error)
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
    const trackingBlocked = requireTrackingEnabled(user)
    if (trackingBlocked) return trackingBlocked

    const { fantasyData } = await request.json()

    if (!fantasyData) {
      return NextResponse.json(
        { error: 'Fantasy data is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('fantasy_entries')
      .insert({
        user_id: user.id,
        title: fantasyData.title,
        content: fantasyData.content,
        type: fantasyData.type,
        tags: fantasyData.tags || [],
        is_shared_with_partner: fantasyData.isSharedWithPartner || false,
        mood: fantasyData.mood,
        phase: fantasyData.phase,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Fantasy entry created successfully',
      data 
    })
  } catch (error) {
    console.error('Create fantasy entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const trackingBlocked = requireTrackingEnabled(user)
    if (trackingBlocked) return trackingBlocked

    const { id, fantasyData } = await request.json()

    if (!id || !fantasyData) {
      return NextResponse.json(
        { error: 'ID and fantasy data are required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    
    if (fantasyData.title !== undefined) {
      updateData.title = fantasyData.title
    }
    
    if (fantasyData.content !== undefined) {
      updateData.content = fantasyData.content
    }
    
    if (fantasyData.type !== undefined) {
      updateData.type = fantasyData.type
    }
    
    if (fantasyData.tags !== undefined) {
      updateData.tags = fantasyData.tags
    }
    
    if (fantasyData.isSharedWithPartner !== undefined) {
      updateData.is_shared_with_partner = fantasyData.isSharedWithPartner
    }
    
    if (fantasyData.mood !== undefined) {
      updateData.mood = fantasyData.mood
    }
    
    if (fantasyData.phase !== undefined) {
      updateData.phase = fantasyData.phase
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('fantasy_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Fantasy entry updated successfully',
      data 
    })
  } catch (error) {
    console.error('Update fantasy entry error:', error)
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
    const trackingBlocked = requireTrackingEnabled(user)
    if (trackingBlocked) return trackingBlocked

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fantasy_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Fantasy entry deleted successfully' })
  } catch (error) {
    console.error('Delete fantasy entry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
