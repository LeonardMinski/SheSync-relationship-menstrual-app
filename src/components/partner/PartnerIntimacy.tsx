/**
 * Partner Intimacy Component - Read-only view for partner to see shared intimacy sessions
 *
 * Features:
 * - View shared intimacy cards from partner
 * - Read-only access to partner's daily selections
 * - Supportive messaging and encouragement
 * - Partner connection status
 * - Privacy-focused design (only shows shared content)
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Users, Calendar, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPartnerSharedSessions } from "@/services/intimacy/share";
import {
  getCategoryDisplayName,
  formatDateShort,
  getSessionSummary,
} from "@/features/intimacy/intimacy.selectors";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { IntimacySession } from "@/services/intimacy/share";

export default function PartnerIntimacyPage() {
  const { user, loading } = useAuth();
  const [sharedSessions, setSharedSessions] = useState<IntimacySession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadPartnerData = useCallback(async () => {
    if (!user) return;

    try {
      const sessions = await getPartnerSharedSessions(user.id);
      setSharedSessions(sessions);
    } catch (error) {
      console.error("Error loading partner data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      void loadPartnerData();
    }
  }, [user, loading, loadPartnerData]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access Required
          </h1>
          <p className="text-muted">
            Please sign in to access partner features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:bg-[#0F0A1A]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cta-gradient)] shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Partner Intimacy
          </h1>
          <p className="text-muted">
            Support your partner&apos;s connection journey
          </p>
        </div>

        {/* Today at a Glance */}
        <section className="mb-8">
          <div className="card dark:card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Today at a Glance
            </h2>

            {sharedSessions.length > 0 ? (
              <div className="space-y-4">
                {sharedSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="elevated p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-muted" />
                        <span className="text-sm text-muted">
                          {formatDateShort(session.date)}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {getCategoryDisplayName(
                          session.selected_card?.category || "",
                        )}
                      </span>
                    </div>

                    <h3 className="text-foreground font-medium mb-2">
                      {getSessionSummary(session)}
                    </h3>

                    <p className="text-foreground text-sm leading-relaxed mb-3">
                      {session.selected_card?.text}
                    </p>

                    {session.reflection && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageCircle size={14} className="text-muted" />
                          <span className="text-xs text-muted font-medium">
                            Reflection
                          </span>
                        </div>
                        <p className="text-foreground text-sm">
                          {session.reflection}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Shared Activities Yet
                </h3>
                <p className="text-muted text-sm">
                  Your partner hasn&apos;t shared any intimacy activities yet.
                  Encourage them to explore connection cards together.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Supportive Actions */}
        <section className="mb-8">
          <div className="card dark:card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Supportive Actions
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart
                    size={12}
                    className="text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Be present and attentive
                  </p>
                  <p className="text-xs text-muted">
                    Listen actively when your partner shares their experiences.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle
                    size={12}
                    className="text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Ask thoughtful questions
                  </p>
                  <p className="text-xs text-muted">
                    Show interest in their reflections and feelings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users
                    size={12}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Respect boundaries
                  </p>
                  <p className="text-xs text-muted">
                    Honour their comfort levels and consent preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Connection Tips */}
        <section>
          <div className="card dark:card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Connection Tips
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  💡 <strong>Remember:</strong> This is your partner&apos;s personal
                  journey. Support them by being understanding and
                  non-judgmental.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-700 dark:text-green-300 text-sm">
                  🌱 <strong>Growth:</strong> Use these insights to better
                  understand your partner&apos;s needs and preferences.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  💜 <strong>Intimacy:</strong> True connection comes from
                  mutual respect, understanding, and emotional safety.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
