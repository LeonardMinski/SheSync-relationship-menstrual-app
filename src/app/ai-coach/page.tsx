'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Bot, User, Sparkles, Brain, Heart, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { mockAIResponses } from '@/lib/mockData';
import { AICoachMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const AICoach = () => {
  const { state, addAIMessage } = useApp();
  const { user, cycleData, currentPhase, aiMessages, isLoading } = state;
  const [inputMessage, setInputMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading AI Coach..." />
      </div>
    );
  }

  const generateAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Determine response category based on keywords
    if (lowerQuestion.includes('cycle') || lowerQuestion.includes('period') || lowerQuestion.includes('phase')) {
      return mockAIResponses.cycle;
    } else if (lowerQuestion.includes('mood') || lowerQuestion.includes('feel') || lowerQuestion.includes('emotional')) {
      return mockAIResponses.mood;
    } else if (lowerQuestion.includes('energy') || lowerQuestion.includes('tired') || lowerQuestion.includes('workout')) {
      return mockAIResponses.energy;
    } else if (lowerQuestion.includes('partner') || lowerQuestion.includes('relationship') || lowerQuestion.includes('intimacy')) {
      return mockAIResponses.relationship;
    } else {
      return mockAIResponses.default;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isResponding) return;

    const question = inputMessage;
    setInputMessage('');
    setIsResponding(true);

    // Create user message
    const userMessage: AICoachMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      question,
      response: '',
      phase: currentPhase,
      relevantData: cycleData[cycleData.length - 1] || {},
    };

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(question);
      const aiMessage: AICoachMessage = {
        ...userMessage,
        response,
      };

      addAIMessage(aiMessage);
      setIsResponding(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Why do I feel so anxious today?",
    "Should I do intense workouts today?",
    "What phase am I in and how should I adapt?",
    "How can I improve my mood naturally?",
    "What should I eat during this phase?",
    "How can I support my partner better?"
  ];

  const todaysData = cycleData.find(d => 
    format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-3 rounded-xl">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Coach</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Your personal cycle-powered wellness assistant
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-r from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20 rounded-xl p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-purple-500" size={20} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currently in {currentPhase} phase
                </span>
              </div>
              {todaysData && (
                <>
                  <div className="flex items-center space-x-2">
                    <Brain className="text-rose-500" size={16} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mood: {todaysData.mood}/10
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="text-yellow-500" size={16} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Energy: {todaysData.energy}/10
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-rose-200 dark:border-gray-700 flex flex-col h-[600px]">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {aiMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bot className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Hi {user?.name}! I'm your AI wellness coach.
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  I understand your cycle, mood patterns, and energy levels. Ask me anything about 
                  your wellbeing, relationships, or how to optimize your day based on your current phase.
                </p>
                
                {/* Quick Questions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Try asking me:
                  </p>
                  <div className="grid gap-2 max-w-lg mx-auto">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className="text-left p-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        "{question}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {aiMessages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="flex items-start space-x-3 max-w-3xl">
                        <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                          <p className="text-sm">{message.question}</p>
                        </div>
                        <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full">
                          <User size={16} className="text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3 max-w-3xl">
                        <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-full">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                          <p className="text-sm text-gray-900 dark:text-white">{message.response}</p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {format(message.timestamp, 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Typing Indicator */}
            {isResponding && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-full">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-rose-200 dark:border-gray-600">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your cycle, mood, energy, or relationships..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={2}
                  disabled={isResponding}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isResponding}
                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white p-3 rounded-xl hover:from-rose-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AICoach;