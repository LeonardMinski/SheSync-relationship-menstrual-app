import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const isShared = searchParams.get('isShared')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('fantasy_entries')
      .select('*')
      .eq('user_id', userId)

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
    const { userId, fantasyData } = await request.json()

    if (!userId || !fantasyData) {
      return NextResponse.json(
        { error: 'User ID and fantasy data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('fantasy_entries')
      .insert({
        user_id: userId,
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
    const { id, fantasyData } = await request.json()

    if (!id || !fantasyData) {
      return NextResponse.json(
        { error: 'ID and fantasy data are required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fantasy_entries')
      .delete()
      .eq('id', id)

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
