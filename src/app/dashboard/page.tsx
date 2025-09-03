'use client';

import React, { useState, useEffect } from 'react';
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
  Target
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
const calculateSmartPrediction = (cycleData: CycleData[]) => {
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
  const sortedData = [...cycleData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestEntry = sortedData[0];
  const today = new Date();
  const lastEntryDate = new Date(latestEntry.date);
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
      const current = new Date(menstrualEntries[i].date);
      const next = new Date(menstrualEntries[i + 1].date);
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
  const lastPeriodDate = new Date(lastMenstrualEntry.date);
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

// Tooltip component
const PhaseTooltip: React.FC<{ phase: CyclePhase; children: React.ReactNode }> = ({ phase, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const explanation = phaseExplanations[phase];
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // Position tooltip to the right of the trigger element
      let x = rect.right + scrollX + 8; // 8px gap
      let y = rect.top + scrollY - 8; // Align with top, slight offset
      
      // Check if tooltip would go off screen horizontally
      const tooltipWidth = 320; // 80 * 4 (w-80)
      if (x + tooltipWidth > window.innerWidth + scrollX) {
        // Position to the left instead
        x = rect.left + scrollX - tooltipWidth - 8;
      }
      
      // Check if tooltip would go off screen vertically
      const tooltipHeight = 300; // Approximate height
      if (y + tooltipHeight > window.innerHeight + scrollY) {
        y = window.innerHeight + scrollY - tooltipHeight - 16;
      }
      
      // Ensure tooltip doesn't go above viewport
      if (y < scrollY + 16) {
        y = scrollY + 16;
      }
      
      setTooltipPosition({ x, y });
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {showTooltip && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm" />
          {/* Tooltip */}
          <div 
            className="fixed z-[9999] w-80 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl"
            style={{ 
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getPhaseEmoji(phase)}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{explanation.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{explanation.description}</p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div><strong>Duration:</strong> {explanation.duration}</div>
              <div><strong>Hormones:</strong> {explanation.hormones}</div>
              <div><strong>Tips:</strong> {explanation.tips}</div>
            </div>
            {/* Close hint */}
            <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
              Move mouse away to close
            </div>
          </div>
        </>
      )}
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
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hi, {authUser?.name?.split(' ')[0] || authUser?.email?.split('@')[0]}!
          </h1>
              <p className="text-gray-600 dark:text-gray-300">
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
            <div className="bg-gradient-to-r from-purple-50 to-rose-50 dark:from-purple-900/20 dark:to-rose-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
              <div className="flex items-start gap-2">
                {smartPrediction.isActualData ? (
                  <Target size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Sparkles size={16} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
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
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {smartPrediction.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {smartPrediction.explanation}
                  </p>
                  {!smartPrediction.isActualData && smartPrediction.averageCycleLength !== 28 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Based on your {smartPrediction.averageCycleLength}-day average cycle
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {getInsightForPhase(smartPrediction.predictedPhase)}
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
