import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const isAnswered = searchParams.get('isAnswered')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('intimacy_cards')
      .select('*')
      .eq('user_id', userId)

    if (category) {
      query = query.eq('category', category)
    }

    if (isAnswered !== null) {
      query = query.eq('is_answered', isAnswered === 'true')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get intimacy cards error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, cardData } = await request.json()

    if (!userId || !cardData) {
      return NextResponse.json(
        { error: 'User ID and card data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('intimacy_cards')
      .insert({
        user_id: userId,
        category: cardData.category,
        question: cardData.question,
        description: cardData.description,
        tags: cardData.tags || [],
        is_answered: false,
        is_shared: cardData.isShared || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Intimacy card created successfully',
      data 
    })
  } catch (error) {
    console.error('Create intimacy card error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, cardData } = await request.json()

    if (!id || !cardData) {
      return NextResponse.json(
        { error: 'ID and card data are required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (cardData.userAnswer !== undefined) {
      updateData.user_answer = cardData.userAnswer
      updateData.is_answered = true
    }
    
    if (cardData.partnerAnswer !== undefined) {
      updateData.partner_answer = cardData.partnerAnswer
    }
    
    if (cardData.isShared !== undefined) {
      updateData.is_shared = cardData.isShared
    }

    const { data, error } = await supabase
      .from('intimacy_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Intimacy card updated successfully',
      data 
    })
  } catch (error) {
    console.error('Update intimacy card error:', error)
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
      .from('intimacy_cards')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Intimacy card deleted successfully' })
  } catch (error) {
    console.error('Delete intimacy card error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
