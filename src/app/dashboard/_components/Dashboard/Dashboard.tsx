/**
 * Dashboard Component - Main user dashboard for cycle tracking and insights
 * 
 * Features:
 * - Cycle phase display with tooltips
 * - Today's cycle stats (Mood, Phase, Symptoms, Logged date)
 * - Cycle logging form with mood slider and symptom selection
 * - Smart predictions based on cycle data
 * - Interactive calendar view
 * - Phase-specific insights and recommendations
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  Droplet,
  Info,
  Sparkles,
  Clock,
  Target,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useCycleLogger } from '@/features/cycle/hooks/useCycleLogger';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getPhaseEmoji, getPhaseColor } from '@/lib/mockData';
import { CycleData, CyclePhase } from '@/types';

// Phase explanations for tooltips
const phaseExplanations = {
  menstrual: {
    title: "Menstrual Phase",
    description: "Days 1-5 of your cycle. Your period has arrived! Hormone levels are at their lowest. You might feel tired and need extra rest. Focus on gentle self-care and iron-rich foods.",
    duration: "3-7 days",
    hormones: "Estrogen & Progesterone: Low",
    tips: "Rest, hydrate, gentle movement, warm baths"
  },
  follicular: {
    title: "Follicular Phase", 
    description: "Days 1-13 of your cycle. Your energy is building! Estrogen rises, making you feel more optimistic and social. Great time for new projects and challenges.",
    duration: "7-10 days",
    hormones: "Estrogen: Rising, Progesterone: Low",
    tips: "Try new things, socialize, intense workouts"
  },
  ovulation: {
    title: "Ovulation Phase",
    description: "Around day 14. You're at your peak! Estrogen peaks and you might feel most confident, attractive, and energetic. Libido is typically highest.",
    duration: "3-5 days",
    hormones: "Estrogen: Peak, LH Surge",
    tips: "Date nights, important meetings, creative work"
  },
  luteal: {
    title: "Luteal Phase",
    description: "Days 15-28. Progesterone rises, energy may dip. You might feel more introspective. Great time for planning and reflection.",
    duration: "10-14 days",
    hormones: "Progesterone: Rising, Estrogen: Moderate",
    tips: "Plan ahead, gentle exercise, self-care"
  }
};

// Smart prediction calculation
const calculateSmartPrediction = (cycles: any[]) => {
  if (!cycles || cycles.length === 0) {
    return {
      nextPeriod: null,
      nextOvulation: null,
      cycleLength: 28,
      confidence: 'low',
      daysSinceLastEntry: null,
      averageCycleLength: 28,
      isActualData: false
    };
  }

  // Sort cycles by date
  const sortedCycles = [...cycles].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Calculate cycle lengths
  const cycleLengths = [];
  for (let i = 1; i < sortedCycles.length; i++) {
    const prevDate = new Date(sortedCycles[i - 1].created_at);
    const currDate = new Date(sortedCycles[i].created_at);
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 50) { // Reasonable cycle length
      cycleLengths.push(diffDays);
    }
  }

  const averageCycleLength = cycleLengths.length > 0 
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28;

  const lastEntry = sortedCycles[sortedCycles.length - 1];
  const lastEntryDate = new Date(lastEntry.created_at);
  const daysSinceLastEntry = Math.round((Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));

  // Simple prediction logic
  const nextPeriod = new Date(lastEntryDate);
  nextPeriod.setDate(nextPeriod.getDate() + averageCycleLength);

  const nextOvulation = new Date(lastEntryDate);
  nextOvulation.setDate(nextOvulation.getDate() + Math.round(averageCycleLength * 0.6));

  const confidence = cycleLengths.length >= 3 ? 'high' : cycleLengths.length >= 1 ? 'medium' : 'low';

  return {
    nextPeriod,
    nextOvulation,
    cycleLength: averageCycleLength,
    confidence,
    daysSinceLastEntry,
    averageCycleLength,
    isActualData: true
  };
};

// Portal-based Tooltip component
const PhaseTooltip: React.FC<{ phase: CyclePhase; children: React.ReactNode }> = ({ phase, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explanation = phaseExplanations[phase];

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltipWithDelay = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(true);
  };

  const hideTooltipWithDelay = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  };

  const hideTooltipImmediately = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  };

  const cancelHideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const renderTooltip = () => {
    if (!mounted || !showTooltip) return null;

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) return null;

    const tooltipStyle = {
      position: 'fixed' as const,
      top: triggerRect.bottom + window.scrollY + 8,
      left: Math.max(16, Math.min(triggerRect.left + window.scrollX, window.innerWidth - 336)),
      zIndex: 9999,
    };

    return createPortal(
      <div 
        ref={tooltipRef}
        style={tooltipStyle}
        className="animate-in fade-in-0 zoom-in-95 duration-200"
        onMouseEnter={cancelHideTooltip}
        onMouseLeave={hideTooltipImmediately}
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10" 
          onClick={hideTooltipImmediately}
        />
        
        {/* Tooltip */}
        <div className="w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-[calc(100vw-2rem)] relative">
          {/* Close button */}
          <button
            onClick={hideTooltipImmediately}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Close tooltip"
          >
            <X size={14} />
          </button>
          
          <div className="flex items-center gap-2 mb-2 pr-6">
            <span className="text-2xl">{getPhaseEmoji(phase)}</span>
            <h3 className="font-semibold text-white dark:text-white">{explanation.title}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{explanation.description}</p>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div><strong>Duration:</strong> {explanation.duration}</div>
            <div><strong>Hormones:</strong> {explanation.hormones}</div>
            <div><strong>Tips:</strong> {explanation.tips}</div>
          </div>
          <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
            Click anywhere outside or ✕ to close
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block cursor-help"
        onMouseEnter={showTooltipWithDelay}
        onMouseLeave={hideTooltipWithDelay}
        onClick={showTooltipWithDelay}
      >
        {children}
      </div>
      {renderTooltip()}
    </>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const { state } = useApp();
  const { user: authUser } = useAuth();
  const { user, currentPhase, isLoading } = state;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCycleLog, setShowCycleLog] = useState(false);
  
  const { logCycle, fetchCycles, cycles, loading, error, clearError } = useCycleLogger();

  // Calculate smart prediction
  const smartPrediction = calculateSmartPrediction(cycles);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !authUser) {
      router.push('/auth/login');
    }
  }, [authUser, isLoading, router]);

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

  // Don't render if not authenticated
  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Redirecting to login..." />
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
      menstrual: "Rest and recovery time. Focus on gentle self-care and nourishing foods.",
      follicular: "Energy is building! Great time for new projects and social activities.",
      ovulation: "Peak energy and confidence. Perfect for important conversations and dates.",
      luteal: "Body is preparing for next cycle. Prioritize self-care and mindful activities."
    };
    return insights[phase];
  };

  const commonSymptoms = [
    'Cramping', 'Bloating', 'Headache', 'Fatigue', 'Cravings', 
    'Tender breasts', 'Mood swings', 'Acne', 'Back pain', 'Nausea'
  ];

  return (
    <div className="min-h-screen pb-20" style={{backgroundColor: 'var(--bg-primary)'}}>
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>
            Hi, {authUser?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-lg" style={{color: 'var(--text-secondary)'}}>
            {format(new Date(), 'EEEE, MMMM do')}
          </p>
        </div>

        {/* Current Phase */}
        <div className="text-center mb-8">
          <PhaseTooltip phase={currentPhase}>
            <div 
              className={`inline-flex items-center px-6 py-3 rounded-full font-semibold shadow-lg ${getPhaseColor(currentPhase)}`}
            >
              <span className="mr-2 text-2xl">{getPhaseEmoji(currentPhase)}</span>
              {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
              <Info className="ml-2 h-4 w-4" />
            </div>
          </PhaseTooltip>
          <p className="mt-3 text-sm text-gray-900 dark:text-gray-300">
            {getInsightForPhase(currentPhase)}
          </p>
        </div>

        {/* Today's Cycle Stats */}
        {todaysData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="text-rose-500" size={20} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Mood</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysData.mood}/10
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Phase</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white" style={{color: 'var(--text-primary)'}}>
                {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Symptoms</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {todaysData.symptoms.length}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
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
            className="mt-8 px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 dark:from-violet-600 dark:via-purple-600 dark:to-rose-500 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:via-purple-700 dark:hover:to-rose-600 transition-all duration-300 shadow-lg dark:shadow-purple-900/50 hover:shadow-xl dark:hover:shadow-purple-900/70 hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Log Today's Entry</span>
          </button>
        </div>

        {/* Smart Predictions */}
        {smartPrediction.isActualData && (
          <div className="mt-12 p-6 rounded-2xl" style={{backgroundColor: 'var(--bg-secondary)'}}>
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{color: 'var(--text-primary)'}}>
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
              Smart Predictions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="font-medium" style={{color: 'var(--text-primary)'}}>Next Period</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                    {smartPrediction.nextPeriod ? format(smartPrediction.nextPeriod, 'MMM d') : 'Not enough data'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="font-medium" style={{color: 'var(--text-primary)'}}>Next Ovulation</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                    {smartPrediction.nextOvulation ? format(smartPrediction.nextOvulation, 'MMM d') : 'Not enough data'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg" style={{backgroundColor: 'var(--bg-overlay)'}}>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                <strong>Confidence:</strong> {smartPrediction.confidence} • 
                <strong> Average cycle:</strong> {smartPrediction.averageCycleLength} days
              </p>
            </div>
          </div>
        )}

        {/* Cycle Log Modal */}
        {showCycleLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md p-6 rounded-3xl shadow-2xl relative overflow-hidden" style={{backgroundColor: 'var(--bg-secondary)'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-3xl pointer-events-none" />
              <div className="relative z-10">
              <h3 className="text-xl font-bold text-white dark:text-white mb-4">Log Cycle Entry</h3>
              
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
                    className="w-full p-4 rounded-2xl backdrop-blur-sm shadow-sm transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)'
                    }}
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
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--accent-start) 0%, var(--accent-start) ${(cycleLogData.mood - 1) * 11.11}%, var(--bg-secondary) ${(cycleLogData.mood - 1) * 11.11}%, var(--bg-secondary) 100%)`
                    }}
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
                        className={`p-2 rounded-lg text-sm transition-colors border ${
                          cycleLogData.symptoms.includes(symptom)
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  className="flex-1 py-4 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCycleLog}
                  disabled={loading}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-rose-500 to-purple-600 dark:from-violet-600 dark:via-purple-600 dark:to-rose-500 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:via-purple-700 dark:hover:to-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-purple-900/50 hover:shadow-xl dark:hover:shadow-purple-900/70 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
