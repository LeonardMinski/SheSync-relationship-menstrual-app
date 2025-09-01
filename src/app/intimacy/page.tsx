'use client';

import React, { useState } from 'react';
import { Heart, Users, Sparkles, Eye, EyeOff, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { IntimacyCard } from '@/types';

const IntimacyDeck = () => {
  const { state, updateIntimacyCard } = useApp();
  const { user, intimacyCards, isLoading } = state;
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'emotional' | 'sensual' | 'fantasy'>('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading intimacy cards..." />
      </div>
    );
  }

  const categories = [
    { id: 'all', name: 'All Cards', icon: Heart, color: 'bg-pink-500' },
    { id: 'emotional', name: 'Emotional', icon: Heart, color: 'bg-rose-500' },
    { id: 'sensual', name: 'Sensual', icon: Users, color: 'bg-purple-500' },
    { id: 'fantasy', name: 'Fantasy', icon: Sparkles, color: 'bg-indigo-500' },
  ];

  const filteredCards = selectedCategory === 'all' 
    ? intimacyCards 
    : intimacyCards.filter(card => card.category === selectedCategory);

  const currentCard = filteredCards[currentCardIndex];

  const handleAnswer = () => {
    if (!userAnswer.trim()) return;

    updateIntimacyCard(currentCard.id, {
      isAnswered: true,
      userAnswer: userAnswer.trim(),
    });

    setUserAnswer('');
    setIsAnswering(false);
    setShowAnswer(true);
  };

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    setShowAnswer(false);
    setUserAnswer('');
    setIsAnswering(false);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    setShowAnswer(false);
    setUserAnswer('');
    setIsAnswering(false);
  };

  const toggleShare = () => {
    updateIntimacyCard(currentCard.id, {
      isShared: !currentCard.isShared
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      emotional: 'from-rose-500 to-pink-500',
      sensual: 'from-purple-500 to-violet-500',
      fantasy: 'from-indigo-500 to-blue-500',
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  if (filteredCards.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No cards in this category
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Try selecting a different category to see more cards.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-3 rounded-xl">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Intimacy Deck</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Deepen your connection through meaningful conversations
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id as any);
                    setCurrentCardIndex(0);
                    setShowAnswer(false);
                    setIsAnswering(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Display */}
        <div className="relative">
          {/* Card */}
          <div className={`bg-gradient-to-br ${getCategoryColor(currentCard.category)} rounded-3xl p-8 text-white shadow-2xl min-h-[400px] flex flex-col justify-between`}>
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {currentCard.category.charAt(0).toUpperCase() + currentCard.category.slice(1)}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {currentCardIndex + 1} of {filteredCards.length}
                </span>
              </div>
              
              {currentCard.isAnswered && (
                <button
                  onClick={toggleShare}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                  title={currentCard.isShared ? 'Shared with partner' : 'Share with partner'}
                >
                  {currentCard.isShared ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              )}
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-relaxed">
                  {currentCard.question}
                </h2>
                {currentCard.description && (
                  <p className="text-white/80 text-lg">
                    {currentCard.description}
                  </p>
                )}
              </div>
            </div>

            {/* Answer Section */}
            <div className="space-y-4">
              {!isAnswering && !showAnswer && !currentCard.isAnswered && (
                <button
                  onClick={() => setIsAnswering(true)}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Answer This Question
                </button>
              )}

              {isAnswering && (
                <div className="space-y-3">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full p-4 bg-white/20 placeholder-white/60 text-white rounded-xl resize-none focus:bg-white/30 focus:outline-none"
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsAnswering(false)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAnswer}
                      disabled={!userAnswer.trim()}
                      className="flex-1 bg-white text-gray-900 hover:bg-white/90 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Save Answer
                    </button>
                  </div>
                </div>
              )}

              {(showAnswer || currentCard.isAnswered) && (
                <div className="space-y-4">
                  <div className="bg-white/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-sm font-medium">Your Answer</span>
                    </div>
                    <p className="text-white/90">
                      {currentCard.userAnswer || 'No answer yet'}
                    </p>
                  </div>

                  {currentCard.partnerAnswer && (
                    <div className="bg-white/20 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                        <span className="text-sm font-medium">Partner's Answer</span>
                      </div>
                      <p className="text-white/90">
                        {currentCard.partnerAnswer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevCard}
              className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setCurrentCardIndex(Math.floor(Math.random() * filteredCards.length));
                  setShowAnswer(false);
                  setIsAnswering(false);
                }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
                title="Random card"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <button
              onClick={nextCard}
              className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Tags */}
          {currentCard.tags && currentCard.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {currentCard.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-500">
                {intimacyCards.filter(card => card.isAnswered).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cards Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {intimacyCards.filter(card => card.isShared).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Shared with Partner</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-500">
                {intimacyCards.filter(card => card.partnerAnswer).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Partner Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">
                {Math.round((intimacyCards.filter(card => card.isAnswered).length / intimacyCards.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Completion</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntimacyDeck;