'use client';

import React, { useState, useEffect } from 'react';
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
import { useCycleLogger } from '@/hooks/useCycleLogger';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getPhaseEmoji, getPhaseColor } from '@/lib/mockData';
import { CycleData, CyclePhase } from '@/types';

const CycleTracker = () => {
  const { state } = useApp();
  const { user, currentPhase, isLoading } = state;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCycleLog, setShowCycleLog] = useState(false);
  
  const { logCycle, fetchCycles, cycles, loading, error, clearError } = useCycleLogger();

  // Cycle log form state
  const [cycleLogData, setCycleLogData] = useState({
    phase: 'menstrual',
    mood: 5,
    symptoms: [] as string[]
  });

  // Fetch cycles on component mount
  useEffect(() => {
    if (user) {
      fetchCycles();
    }
  }, [user, fetchCycles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your cycle data..." />
      </div>
    );
  }

  // Get today's cycle data
  const todaysData = cycles.find(cycle => 
    format(new Date(cycle.created_at || ''), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const selectedDateData = cycles.find(cycle => 
    format(new Date(cycle.created_at || ''), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleCycleLog = async () => {
    const success = await logCycle(cycleLogData);
    if (success) {
      setShowCycleLog(false);
      setCycleLogData({
        phase: 'menstrual',
        mood: 5,
        symptoms: []
      });
    }
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

        {/* Today's Cycle Stats */}
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
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Phase</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {todaysData.phase.charAt(0).toUpperCase() + todaysData.phase.slice(1)}
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Symptoms</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {todaysData.symptoms.length}
              </div>
            </div>
            
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-rose-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-blue-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Logged</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {format(new Date(todaysData.created_at || ''), 'MMM d')}
              </div>
            </div>
          </div>
        )}

        {/* Cycle Log Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowCycleLog(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-rose-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            <span>Log Cycle Entry</span>
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
              const dayData = cycles.find(cycle => 
                format(new Date(cycle.created_at || ''), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
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
                      <div className="text-lg">{getPhaseEmoji(dayData.phase as CyclePhase)}</div>
                      <div className="text-xs text-gray-500">
                        {dayData.mood}/10
                      </div>
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
          </div>
        )}

        {/* Recent Cycle Entries */}
        {cycles.length > 0 && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Cycle Entries</h3>
            <div className="space-y-3">
              {cycles.slice(0, 5).map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getPhaseEmoji(cycle.phase as CyclePhase)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cycle.phase.charAt(0).toUpperCase() + cycle.phase.slice(1)} Phase
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(cycle.created_at || ''), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Mood: {cycle.mood}/10
                    </div>
                    {cycle.symptoms.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {cycle.symptoms.length} symptoms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cycle Log Modal */}
      {showCycleLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Log Cycle Entry</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Phase Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cycle Phase
                </label>
                <select
                  value={cycleLogData.phase}
                  onChange={(e) => setCycleLogData({...cycleLogData, phase: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="menstrual">Menstrual</option>
                  <option value="follicular">Follicular</option>
                  <option value="ovulation">Ovulation</option>
                  <option value="luteal">Luteal</option>
                </select>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cycleLogData.mood}
                  onChange={(e) => setCycleLogData({...cycleLogData, mood: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {cycleLogData.mood}/10
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
                        const symptoms = cycleLogData.symptoms.includes(symptom)
                          ? cycleLogData.symptoms.filter(s => s !== symptom)
                          : [...cycleLogData.symptoms, symptom];
                        setCycleLogData({...cycleLogData, symptoms});
                      }}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        cycleLogData.symptoms.includes(symptom)
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCycleLog(false)}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCycleLog}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleTracker;
