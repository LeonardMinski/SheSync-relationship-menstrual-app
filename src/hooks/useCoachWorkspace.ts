"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendMessage as sendMessageRequest,
} from "@/services/coach";
import type { CoachContextSelection, CoachConversationSummary, CoachMessage } from "@/types/coach";

const TEMP_MESSAGE_PREFIX = "temp-";

function tempUserMessage(conversationId: string, content: string): CoachMessage {
  return {
    id: `${TEMP_MESSAGE_PREFIX}${Date.now()}`,
    conversationId,
    role: "user",
    content,
    fromLogs: null,
    generalContext: null,
    questionToConsider: null,
    optionalNextStep: null,
    partnerTranslationAvailable: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Owns the whole Coach workspace: the conversation list (Previous
 * Conversations), the active conversation's messages, and sending. A brand
 * new conversation is only actually created in the database on the first
 * message send (see sendUserMessage) — clicking "New Conversation" or
 * landing on Coach for the first time never writes an empty row.
 */
export function useCoachWorkspace() {
  const [conversations, setConversations] = useState<CoachConversationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [pendingContext, setPendingContext] = useState<CoachContextSelection | undefined>(undefined);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    const result = await listConversations();
    setLoadingList(false);
    if (result.success) setConversations(result.data);
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setPendingContent(null);
    setPendingContext(undefined);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setLoadingConversation(true);
    setError(null);
    setPendingContent(null);
    setPendingContext(undefined);
    const result = await getConversation(id);
    setLoadingConversation(false);
    if (result.success) {
      setMessages(result.data.messages);
    } else {
      setError(result.error);
      setMessages([]);
    }
  }, []);

  const removeConversation = useCallback(
    async (id: string) => {
      const result = await deleteConversation(id);
      if (!result.success) return result;
      setConversations((current) => current.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        startNewConversation();
      }
      return result;
    },
    [activeConversationId, startNewConversation],
  );

  const sendUserMessage = useCallback(
    async (content: string, context?: CoachContextSelection) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setError(null);
      setPendingContent(trimmed);
      setPendingContext(context);

      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await createConversation();
        if (!created.success) {
          setSending(false);
          setError(created.error);
          return;
        }
        conversationId = created.data.id;
        setActiveConversationId(conversationId);
        setConversations((current) => [created.data, ...current]);
      }

      const optimisticMessage = tempUserMessage(conversationId, trimmed);
      setMessages((current) => [...current, optimisticMessage]);

      const result = await sendMessageRequest(conversationId, trimmed, context);
      setSending(false);

      if (!result.success) {
        setMessages((current) => current.filter((m) => m.id !== optimisticMessage.id));
        setError(result.error);
        return;
      }

      setPendingContent(null);
      setPendingContext(undefined);
      setMessages((current) => [
        ...current.filter((m) => m.id !== optimisticMessage.id),
        result.data.userMessage,
        result.data.assistantMessage,
      ]);
      setConversations((current) => {
        const withoutActive = current.filter((c) => c.id !== conversationId);
        const existing = current.find((c) => c.id === conversationId);
        const updated: CoachConversationSummary = {
          id: conversationId as string,
          title: result.data.title,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preview: trimmed.slice(0, 80),
        };
        return [updated, ...withoutActive];
      });
    },
    [activeConversationId, sending],
  );

  const retry = useCallback(() => {
    if (!pendingContent) return;
    void sendUserMessage(pendingContent, pendingContext);
  }, [pendingContent, pendingContext, sendUserMessage]);

  return {
    conversations,
    loadingList,
    activeConversationId,
    messages,
    loadingConversation,
    sending,
    error,
    pendingContent,
    startNewConversation,
    openConversation,
    removeConversation,
    sendUserMessage,
    retry,
  };
}
