'use client';

import React, { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  Zap, 
  Brain,
  Plus,
  ChevronLeft,
  ChevronRight,
  Droplet
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getPhaseEmoji, getPhaseColor } from '@/lib/mockData';
import { CycleData, CyclePhase } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const CycleTracker = () => {
  const { state, addCycleEntry } = useApp();
  const { user, cycleData, currentPhase, isLoading } = state;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showQuickLog, setShowQuickLog] = useState(false);

  // Quick log form state
  const [quickLogData, setQuickLogData] = useState({
    mood: 5,
    energy: 5,
    libido: 5,
    stress: 5,
    symptoms: [] as string[],
    notes: '',
    periodFlow: undefined as 'light' | 'medium' | 'heavy' | undefined,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your cycle data..." />
      </div>
    );
  }

  const todaysData = cycleData.find(d => 
    format(d.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const selectedDateData = cycleData.find(d => 
    format(d.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleQuickLog = () => {
    const newEntry: CycleData = {
      id: uuidv4(),
      date: new Date(),
      phase: currentPhase,
      ...quickLogData,
      symptoms: quickLogData.symptoms,
    };

    addCycleEntry(newEntry);
    setShowQuickLog(false);
    setQuickLogData({
      mood: 5,
      energy: 5,
      libido: 5,
      stress: 5,
      symptoms: [],
      notes: '',
      periodFlow: undefined,
    });
  };

  const getInsightForPhase = (phase: CyclePhase) => {
    const insights = {
      menstrual: "Your body is shedding and renewing. Focus on rest, warmth, and gentle movement.",
      follicular: "Energy is building! Great time for new projects and social activities.",
      ovulation: "Peak energy and confidence. Perfect for important conversations and challenges.",
      luteal: "Body is preparing for next cycle. Prioritize self-care and mindful activities."
    };
    return insights[phase];
  };

  const commonSymptoms = [
    'Cramping', 'Bloating', 'Headache', 'Fatigue', 'Cravings', 
    'Tender breasts', 'Mood swings', 'Acne', 'Back pain', 'Nausea'
  ];

  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hello, {user?.name}! 
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {format(new Date(), 'EEEE, MMMM do')}
              </p>
            </div>
            <div className="text-4xl">{getPhaseEmoji(currentPhase)}</div>
          </div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getPhaseColor(currentPhase)}`}>
            <span className="mr-2">{getPhaseEmoji(currentPhase)}</span>
            {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
          </div>
          
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {getInsightForPhase(currentPhase)}
          </p>
        </div>

        {/* Today's Quick Stats */}
        {todaysData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="text-rose-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Mood</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysData.mood}/10
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="text-yellow-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Energy</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysData.energy}/10
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="text-red-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Libido</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysData.libido}/10
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Stress</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysData.stress}/10
              </div>
            </div>
          </div>
        )}

        {/* Quick Log Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowQuickLog(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-rose-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            <span>Log Today's Data</span>
          </button>
        </div>

        {/* Calendar View */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calendar View</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 7))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[120px] text-center">
                {format(selectedDate, 'MMM yyyy')}
              </span>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Mini calendar with cycle data */}
          <div className="grid grid-cols-7 gap-2">
            {[-3, -2, -1, 0, 1, 2, 3].map(offset => {
              const date = addDays(selectedDate, offset);
              const dayData = cycleData.find(d => 
                format(d.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div
                  key={offset}
                  className={`p-3 rounded-lg text-center border-2 transition-all ${
                    isToday 
                      ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(date, 'd')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(date, 'EEE')}
                  </div>
                  {dayData && (
                    <div className="mt-2 space-y-1">
                      <div className="text-lg">{getPhaseEmoji(dayData.phase)}</div>
                      {dayData.periodFlow && (
                        <Droplet className="text-red-500 mx-auto" size={12} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Symptoms */}
        {todaysData?.symptoms && todaysData.symptoms.length > 0 && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {todaysData.symptoms.map(symptom => (
                <span
                  key={symptom}
                  className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 rounded-full text-sm"
                >
                  {symptom}
                </span>
              ))}
            </div>
            {todaysData.notes && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 italic">"{todaysData.notes}"</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Log Today's Data</h3>
            
            <div className="space-y-4">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quickLogData.mood}
                  onChange={(e) => setQuickLogData({...quickLogData, mood: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {quickLogData.mood}/10
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Energy (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quickLogData.energy}
                  onChange={(e) => setQuickLogData({...quickLogData, energy: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {quickLogData.energy}/10
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symptoms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {commonSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => {
                        const symptoms = quickLogData.symptoms.includes(symptom)
                          ? quickLogData.symptoms.filter(s => s !== symptom)
                          : [...quickLogData.symptoms, symptom];
                        setQuickLogData({...quickLogData, symptoms});
                      }}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        quickLogData.symptoms.includes(symptom)
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={quickLogData.notes}
                  onChange={(e) => setQuickLogData({...quickLogData, notes: e.target.value})}
                  placeholder="How are you feeling today?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowQuickLog(false)}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickLog}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-purple-700 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleTracker;
