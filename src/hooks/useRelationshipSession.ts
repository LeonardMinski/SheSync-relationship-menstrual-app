"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getSession,
  listSessions,
  markSessionReady,
  revealSessionTogether,
  startSession,
  submitSessionAnswer,
} from "@/services/relationship/sessions";
import type { RelationshipSession, RevealCategory, SessionAnswer, SessionType } from "@/types/relationship";

/**
 * Shared privacy-lifecycle logic for Weekly Us / Mutual Reveal / Repair:
 * start -> each answers privately -> each marks ready -> both ready ->
 * explicit reveal. The server (see relationship-experience-v1-migration.sql)
 * is the real enforcement point — this hook never assumes anything about
 * the other participant's answers beyond what the API actually returned.
 */
export function useRelationshipSession(sessionType: SessionType) {
  const [session, setSession] = useState<RelationshipSession | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = useCallback(async (category?: RevealCategory) => {
    setLoading(true);
    setError(null);

    const listResult = await listSessions(sessionType);
    if (!listResult.success) {
      setLoading(false);
      setError(listResult.error);
      return;
    }

    const match = category
      ? listResult.data.sessions.find((s) => s.category === category)
      : listResult.data.sessions[0];

    if (!match) {
      setSession(null);
      setAnswers([]);
      setLoading(false);
      return;
    }

    const detail = await getSession(match.id);
    setLoading(false);
    if (!detail.success) {
      setError(detail.error);
      return;
    }
    setSession(detail.data.session);
    setAnswers(detail.data.answers);
  }, [sessionType]);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const detail = await getSession(session.id);
    if (detail.success) {
      setSession(detail.data.session);
      setAnswers(detail.data.answers);
    }
  }, [session]);

  const start = useCallback(
    async (category?: RevealCategory) => {
      setActionLoading(true);
      setError(null);
      const result = await startSession(sessionType, category);
      setActionLoading(false);
      if (!result.success) {
        setError(result.error);
        return false;
      }
      setSession(result.data.session);
      setAnswers([]);
      return true;
    },
    [sessionType],
  );

  const answer = useCallback(
    async (promptKey: string, answerText: string) => {
      if (!session) return false;
      setActionLoading(true);
      setError(null);
      const result = await submitSessionAnswer(session.id, promptKey, answerText);
      setActionLoading(false);
      if (!result.success) {
        setError(result.error);
        return false;
      }
      // The server is the source of truth for what "your own answers" now
      // look like — refetch rather than guess at the shape locally.
      await refresh();
      return true;
    },
    [session, refresh],
  );

  const markReady = useCallback(async () => {
    if (!session) return false;
    setActionLoading(true);
    setError(null);
    const result = await markSessionReady(session.id);
    setActionLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    await refresh();
    return true;
  }, [session, refresh]);

  const reveal = useCallback(async () => {
    if (!session) return false;
    setActionLoading(true);
    setError(null);
    const result = await revealSessionTogether(session.id);
    setActionLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    await refresh();
    return true;
  }, [session, refresh]);

  return {
    session,
    answers,
    loading,
    actionLoading,
    error,
    start,
    answer,
    markReady,
    reveal,
    refresh,
    loadLatest,
  };
}
