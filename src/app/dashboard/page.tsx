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
import { useCycleLogger } from '@/hooks/useCycleLogger';
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
    description: "Days 15-28. The calm after the storm. Progesterone rises, you might feel more introspective. PMS symptoms may appear toward the end. Time to slow down and prepare.",
    duration: "10-14 days", 
    hormones: "Progesterone: Rising, Estrogen: Declining",
    tips: "Meal prep, organize, gentle yoga, magnesium"
  }
};

// Smart prediction logic
const calculateSmartPrediction = (cycleData: any[]) => {
  if (!cycleData || cycleData.length === 0) {
    return {
      predictedPhase: 'luteal' as CyclePhase,
      confidence: 0,
      explanation: 'No cycle data available yet',
      daysSinceLastEntry: 0,
      averageCycleLength: 28,
      isActualData: false
    };
  }

  // Sort by date to get most recent entries
  const sortedData = [...cycleData].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
  const latestEntry = sortedData[0];
  const today = new Date();
  const lastEntryDate = new Date(latestEntry.created_at || latestEntry.date);
  const daysSinceLastEntry = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));

  // If we have a recent entry (within 2 days), use actual data
  if (daysSinceLastEntry <= 2) {
    return {
      predictedPhase: latestEntry.phase,
      confidence: 95,
      explanation: `Based on your recent entry from ${daysSinceLastEntry === 0 ? 'today' : daysSinceLastEntry + ' day(s) ago'}`,
      daysSinceLastEntry,
      averageCycleLength: 28,
      isActualData: true
    };
  }

  // Calculate average cycle length from menstrual phases
  const menstrualEntries = sortedData.filter(entry => entry.phase === 'menstrual');
  let averageCycleLength = 28; // default
  
  if (menstrualEntries.length >= 2) {
    const cycleLengths = [];
    for (let i = 0; i < menstrualEntries.length - 1; i++) {
      const current = new Date(menstrualEntries[i].created_at || menstrualEntries[i].date);
      const next = new Date(menstrualEntries[i + 1].created_at || menstrualEntries[i + 1].date);
      const cycleLength = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
      if (cycleLength > 20 && cycleLength < 40) { // reasonable cycle length
        cycleLengths.push(cycleLength);
      }
    }
    if (cycleLengths.length > 0) {
      averageCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    }
  }

  // Find the most recent menstrual phase
  const lastMenstrualEntry = menstrualEntries[0];
  if (!lastMenstrualEntry) {
    // No menstrual data, make educated guess based on last entry
    const daysSince = daysSinceLastEntry;
    let predictedPhase: CyclePhase = 'luteal';
    let confidence = 60;

    if (latestEntry.phase === 'menstrual' && daysSince < 10) {
      predictedPhase = 'follicular';
      confidence = 70;
    } else if (latestEntry.phase === 'follicular' && daysSince < 7) {
      predictedPhase = 'ovulation';
      confidence = 65;
    } else if (latestEntry.phase === 'ovulation' && daysSince < 14) {
      predictedPhase = 'luteal';
      confidence = 75;
    }

    return {
      predictedPhase,
      confidence,
      explanation: `Estimated based on your ${latestEntry.phase} phase entry ${daysSince} days ago`,
      daysSinceLastEntry,
      averageCycleLength,
      isActualData: false
    };
  }

  // Calculate days since last period
  const lastPeriodDate = new Date(lastMenstrualEntry.created_at || lastMenstrualEntry.date);
  const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Predict phase based on cycle day
  let predictedPhase: CyclePhase;
  let confidence: number;
  let explanation: string;

  if (daysSinceLastPeriod <= 5) {
    predictedPhase = 'menstrual';
    confidence = 80;
    explanation = `Day ${daysSinceLastPeriod + 1} of your cycle - typically menstrual phase`;
  } else if (daysSinceLastPeriod <= 13) {
    predictedPhase = 'follicular';
    confidence = 75;
    explanation = `Day ${daysSinceLastPeriod + 1} of your cycle - typically follicular phase`;
  } else if (daysSinceLastPeriod <= 16) {
    predictedPhase = 'ovulation';
    confidence = 70;
    explanation = `Day ${daysSinceLastPeriod + 1} of your cycle - typically ovulation`;
  } else if (daysSinceLastPeriod < averageCycleLength) {
    predictedPhase = 'luteal';
    confidence = 75;
    explanation = `Day ${daysSinceLastPeriod + 1} of your cycle - typically luteal phase`;
  } else {
    // Overdue for next period
    predictedPhase = 'menstrual';
    confidence = 60;
    explanation = `Day ${daysSinceLastPeriod + 1} - your next period may be starting soon`;
  }

  return {
    predictedPhase,
    confidence,
    explanation,
    daysSinceLastEntry,
    averageCycleLength,
    isActualData: false
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
    if (!showTooltip || !triggerRef.current || !mounted) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 280;
    
    // Calculate position
    let left = rect.right + 8;
    let top = rect.top - 8;
    
    // Adjust if going off screen
    if (left + tooltipWidth > window.innerWidth) {
      left = rect.left - tooltipWidth - 8;
    }
    
    if (top + tooltipHeight > window.innerHeight) {
      top = window.innerHeight - tooltipHeight - 16;
    }
    
    if (top < 16) {
      top = 16;
    }

    return createPortal(
      <div 
        ref={tooltipRef}
        className="fixed z-[99999] pointer-events-auto"
        style={{ left, top }}
        onMouseEnter={cancelHideTooltip}
        onMouseLeave={hideTooltipWithDelay}
      >
        {/* Backdrop - click to close */}
        <div 
          className="fixed inset-0 -z-10 bg-black/10 backdrop-blur-[1px] cursor-pointer" 
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
      >
        {children}
      </div>
      {renderTooltip()}
    </>
  );
};

const CycleTracker = () => {
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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-all duration-500 relative overflow-hidden">
      {/* Dark mode ambient background effects */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-violet-950/20 dark:via-transparent dark:to-rose-950/20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 dark:bg-rose-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 dark:bg-purple-600/5 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section - Hero */}
        <div className="card">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hi, {authUser?.name?.split(' ')[0] || authUser?.email?.split('@')[0]}!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {format(new Date(), 'EEEE, MMMM do')}
                </p>
              </div>
              <div className="text-4xl">{getPhaseEmoji(smartPrediction.predictedPhase)}</div>
            </div>
          
          <div className="space-y-3">
            {/* Smart Prediction Display */}
            <PhaseTooltip phase={smartPrediction.predictedPhase}>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium cursor-help ${getPhaseColor(smartPrediction.predictedPhase)}`}>
                <span className="mr-2">{getPhaseEmoji(smartPrediction.predictedPhase)}</span>
                {smartPrediction.predictedPhase.charAt(0).toUpperCase() + smartPrediction.predictedPhase.slice(1)} Phase
                {smartPrediction.isActualData ? (
                  <Target size={14} className="ml-2 opacity-60" />
                ) : (
                  <Sparkles size={14} className="ml-2 opacity-60" />
                )}
                <Info size={14} className="ml-1 opacity-60" />
              </div>
            </PhaseTooltip>

            {/* Prediction Explanation */}
            <div className="p-4 relative">
              <div className="flex items-start gap-2">
                {smartPrediction.isActualData ? (
                  <Target size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Sparkles size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">
                      {smartPrediction.isActualData ? 'Recent Entry' : 'Smart Prediction'}
                    </span>
                    {!smartPrediction.isActualData && (
                      <div className="flex items-center gap-1">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ width: '40px' }}>
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all duration-300"
                            style={{ width: `${smartPrediction.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{color: '#1E1E1E'}}>
                          {smartPrediction.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300">
                    {smartPrediction.explanation}
                  </p>
                  {!smartPrediction.isActualData && smartPrediction.averageCycleLength !== 28 && (
                    <p className="text-xs mt-1 text-gray-300">
                      Based on your {smartPrediction.averageCycleLength}-day average cycle
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            {getInsightForPhase(smartPrediction.predictedPhase)}
          </p>
          </div>
        </div>

        {/* Today's Cycle Stats */}
        {todaysData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-effect rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="text-rose-500" size={20} />
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Mood</span>
              </div>
              <div className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>
                {todaysData.mood}/10
              </div>
            </div>
            
            <div className="glass-effect rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Phase</span>
              </div>
              <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                {todaysData.phase.charAt(0).toUpperCase() + todaysData.phase.slice(1)}
              </div>
            </div>
            
            <div className="glass-effect rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Symptoms</span>
              </div>
              <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                {todaysData.symptoms.length}
              </div>
            </div>
            
            <div className="glass-effect rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="text-blue-500" size={20} />
                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Logged</span>
              </div>
              <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                {format(new Date(todaysData.created_at || ''), 'MMM d')}
              </div>
            </div>
          </div>
        )}

        {/* Cycle Log Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowCycleLog(true)}
            className="btn-cta mt-4 px-6 py-3"
          >
            <Plus size={20} className="mr-2" />
            Log Cycle Entry
          </button>
        </div>

        {/* Calendar View */}
        <div className="card">
          <div>
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
                  <div className="text-sm font-medium text-white dark:text-white">
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
        </div>

        {/* Recent Symptoms */}
        {todaysData?.symptoms && todaysData.symptoms.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-rose-200/50 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-purple-900/20 relative overflow-hidden">
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-slate-800/20 dark:to-transparent pointer-events-none" />
            <div className="relative z-10">
            <h3 className="text-lg font-bold text-white dark:text-white mb-4">Today's Symptoms</h3>
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
          </div>
        )}

        {/* Recent Cycle Entries */}
        {cycles.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-rose-200/50 dark:border-slate-700/50 shadow-xl dark:shadow-2xl dark:shadow-purple-900/20 relative overflow-hidden">
            {/* Glass morphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-slate-800/20 dark:to-transparent pointer-events-none" />
            <div className="relative z-10">
            <h3 className="text-lg font-bold text-white dark:text-white mb-4">Recent Cycle Entries</h3>
            <div className="space-y-3">
              {cycles.slice(0, 5).map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getPhaseEmoji(cycle.phase as CyclePhase)}</span>
                    <div>
                      <div className="font-medium" style={{color: 'var(--text-primary)'}}>
                        {cycle.phase.charAt(0).toUpperCase() + cycle.phase.slice(1)} Phase
                      </div>
                      <div className="text-sm" style={{color: 'var(--text-secondary)'}}>
                        {format(new Date(cycle.created_at || ''), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium" style={{color: 'var(--text-primary)'}}>
                      Mood: {cycle.mood}/10
                    </div>
                    {cycle.symptoms.length > 0 && (
                      <div className="text-sm" style={{color: 'var(--text-secondary)'}}>
                        {cycle.symptoms.length} symptoms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Cycle Log Modal */}
      {showCycleLog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/50 shadow-2xl dark:shadow-purple-900/30 relative">
            {/* Glass morphism overlay */}
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
                className="flex-1 py-4 px-6 bg-gradient-to-r from-rose-500 to-purple-600 dark:from-violet-600 dark:via-purple-600 dark:to-rose-500 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:via-purple-700 dark:hover:to-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-purple-900/50 hover:shadow-xl dark:hover:shadow-purple-900/70 hover:scale-105 active:scale-95"
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleTracker;
