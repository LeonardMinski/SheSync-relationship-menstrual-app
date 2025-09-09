/**
 * Dashboard Page - Main user dashboard for cycle tracking and insights
 * 
 * Features:
 * - Cycle phase display with tooltips
 * - Today's cycle stats (Mood, Phase, Symptoms, Logged date)
 * - Cycle logging form with mood slider and symptom selection
 * - Smart predictions based on cycle data
 * - Interactive calendar view
 * - Phase-specific insights and recommendations
 * 
 * Route: /dashboard
 */
import Dashboard from './_components/Dashboard/Dashboard';

export default function DashboardPage() {
  return <Dashboard />;
}
