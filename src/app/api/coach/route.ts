import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { userId, phase, mood, question } = await request.json()

    // Validate required fields
    if (!userId || !phase || !question) {
      return NextResponse.json(
        { error: 'userId, phase, and question are required' },
        { status: 400 }
      )
    }

    // Create system prompt based on user's current state
    const systemPrompt = `You are a compassionate and knowledgeable women's health and intimacy AI coach. The user is currently in the ${phase} phase of their menstrual cycle with a mood level of ${mood || 'not specified'} (on a scale of 1-10).

Your role is to provide:
- Supportive and empathetic guidance
- Evidence-based information about women's health
- Practical advice for managing cycle-related symptoms
- Intimacy and relationship insights
- Emotional support and validation

Guidelines:
- Be warm, understanding, and non-judgmental
- Provide actionable advice when appropriate
- Acknowledge the user's feelings and experiences
- Keep responses concise but comprehensive
- Avoid medical diagnoses - encourage professional consultation when needed
- Be inclusive and respectful of all experiences

Respond in a conversational, supportive tone that makes the user feel heard and understood.`

    // Create the chat completion request
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              const data = JSON.stringify({ content, done: false })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          
          // Send final message
          const finalData = JSON.stringify({ 
            content: '', 
            done: true,
            metadata: {
              userId,
              phase,
              mood,
              timestamp: new Date().toISOString()
            }
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({ 
            error: 'Failed to generate response',
            done: true 
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('AI Coach API error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
