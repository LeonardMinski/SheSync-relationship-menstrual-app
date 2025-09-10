'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  ArrowLeft,
  Sparkles,
  Heart,
  Brain,
  Zap
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export default function CoachPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && !authLoading) {
      loadChatHistory()
    }
  }, [user, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Load chat history from API
      // For now, add a welcome message
      setMessages([
        {
          id: '1',
          content: "Hello! I'm your AI coach. I'm here to help you understand your cycle, provide insights about your mood and energy patterns, and offer personalized advice for your intimate relationships. How can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }
      ])
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !inputMessage.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send message to AI coach API
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || "I'm here to help! Could you tell me more about what you'd like to discuss?",
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickPrompts = [
    "How can I improve my mood during my period?",
    "What are some intimacy tips for my current cycle phase?",
    "Help me understand my energy patterns",
    "Suggest some self-care activities"
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta-start"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar 
        title="AI Coach" 
        subtitle="Your personal wellness guide"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cta-start" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Try one of these prompts to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => setInputMessage(prompt)}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && <Heart className="h-4 w-4 text-accent-rose" />}
                      {index === 1 && <MessageCircle className="h-4 w-4 text-accent-purple" />}
                      {index === 2 && <Brain className="h-4 w-4 text-warning" />}
                      {index === 3 && <Zap className="h-4 w-4 text-info" />}
                      <span className="text-sm">{prompt}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="h-[60vh] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cta-start" />
              Chat with your AI Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-cta-start text-white'
                      : 'bg-bg-elevated text-foreground border border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      message.role === 'user' 
                        ? 'bg-white/20' 
                        : 'bg-cta-start/10'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' 
                          ? 'text-white/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {format(message.timestamp, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-bg-elevated text-foreground border border-border p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-cta-start/10">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your AI coach anything about your cycle, mood, or relationships..."
                  disabled={isTyping}
                />
              </div>
              <Button
                variant="cta"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navbar />
    </div>
  )
}
