import { useState, useCallback } from 'react'
import { useApp } from '@/context/AppContext'

interface CoachMessage {
  id: string
  question: string
  response: string
  timestamp: Date
  phase: string
  mood?: number
}

interface UseCoachReturn {
  messages: CoachMessage[]
  isLoading: boolean
  error: string | null
  askQuestion: (question: string) => Promise<void>
  clearMessages: () => void
}

export const useCoach = (): UseCoachReturn => {
  const { state } = useApp()
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return

    setIsLoading(true)
    setError(null)

    // Get current user and cycle data
    const userId = state.user?.id
    const currentPhase = state.currentPhase
    const latestCycleData = state.cycleData[state.cycleData.length - 1]
    const mood = latestCycleData?.mood

    if (!userId || !currentPhase) {
      setError('Log cycle data before asking for cycle-specific coaching.')
      setIsLoading(false)
      return
    }

    // Add user question to messages immediately
    const userMessage: CoachMessage = {
      id: `user-${Date.now()}`,
      question,
      response: '',
      timestamp: new Date(),
      phase: currentPhase,
      mood
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          phase: currentPhase,
          mood,
          question
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`
      const aiMessage: CoachMessage = {
        id: aiMessageId,
        question: '',
        response: '',
        timestamp: new Date(),
        phase: currentPhase,
        mood
      }

      setMessages(prev => [...prev, aiMessage])

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let aiResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }

              if (data.content) {
                aiResponse += data.content
                
                // Update the AI message with streaming content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, response: aiResponse }
                      : msg
                  )
                )
              }

              if (data.done) {
                // Finalize the message
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, response: aiResponse, timestamp: new Date(data.metadata?.timestamp || Date.now()) }
                      : msg
                  )
                )
                break
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }

    } catch (err) {
      console.error('Coach API error:', err)
      setError(err instanceof Error ? err.message : 'Failed to get AI response')
      
      // Remove the AI message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== `ai-${Date.now()}`))
    } finally {
      setIsLoading(false)
    }
  }, [state.user?.id, state.currentPhase, state.cycleData])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearMessages
  }
}
