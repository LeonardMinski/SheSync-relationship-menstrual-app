"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCoachWorkspace } from "@/hooks/useCoachWorkspace";
import { DEFAULT_COACH_CONTEXT_SELECTION } from "@/types/coach";
import type { CoachContextSelection, CoachMessage } from "@/types/coach";

import { CoachComposer } from "./CoachComposer";
import { CoachContextPanel } from "./CoachContextPanel";
import { CoachErrorState } from "./CoachErrorState";
import { CoachMessageBubble } from "./CoachMessageBubble";
import { CoachPreviousConversations } from "./CoachPreviousConversations";
import { CoachStarterCards } from "./CoachStarterCards";
import { CoachThinkingState } from "./CoachThinkingState";
import {
  COACH_EMPTY_STATE_PROMPT,
  COACH_HEADER_SUBTITLE,
  COACH_PRIVACY_CHIP_TEXT,
  COACH_STARTER_PROMPTS,
  type CoachStarterCard,
} from "./coach.constants";

export default function CoachView() {
  const router = useRouter();
  const {
    conversations,
    loadingList,
    activeConversationId,
    messages,
    loadingConversation,
    sending,
    error,
    startNewConversation,
    openConversation,
    removeConversation,
    sendUserMessage,
    retry,
  } = useCoachWorkspace();

  const [contextSelection, setContextSelection] = useState<CoachContextSelection>(DEFAULT_COACH_CONTEXT_SELECTION);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  function handleSend(content: string) {
    void sendUserMessage(content, contextSelection);
  }

  function handleStarterCard(card: CoachStarterCard) {
    const prompt = COACH_STARTER_PROMPTS[card.id];
    if (prompt) handleSend(prompt);
  }

  function handleTurnIntoPartnerContext(message: CoachMessage) {
    const insight = message.fromLogs ?? message.content;
    router.push(`/connect/translate?insight=${encodeURIComponent(insight)}`);
  }

  const isEmpty = messages.length === 0 && !loadingConversation;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cta-start">Coach</p>
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {isEmpty ? COACH_EMPTY_STATE_PROMPT : "Your conversation"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{COACH_HEADER_SUBTITLE}</p>
          <StatusPill tone="sage" className="mt-3 uppercase tracking-wide">
            {COACH_PRIVACY_CHIP_TEXT}
          </StatusPill>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowContextPanel(true)}>
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Manage Context
          </Button>
          {!isEmpty && (
            <Button variant="secondary" size="sm" onClick={startNewConversation}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              New Conversation
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {isEmpty ? (
            <>
              <CoachComposer onSend={handleSend} disabled={sending} autoFocus />
              <CoachStarterCards onSelect={handleStarterCard} />
            </>
          ) : (
            <>
              <div className="space-y-4" role="log" aria-live="polite">
                {loadingConversation ? (
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                ) : (
                  messages.map((message) => (
                    <CoachMessageBubble
                      key={message.id}
                      message={message}
                      onTurnIntoPartnerContext={handleTurnIntoPartnerContext}
                    />
                  ))
                )}
                {sending && <CoachThinkingState />}
                <div ref={messagesEndRef} />
              </div>

              {error && <CoachErrorState onRetry={retry} />}

              <CoachComposer onSend={handleSend} disabled={sending} />
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <CoachPreviousConversations
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingList}
            onOpen={(id) => void openConversation(id)}
            onNew={startNewConversation}
            onDelete={(id) => void removeConversation(id)}
          />
        </div>
      </div>

      {showContextPanel && (
        <CoachContextPanel
          selection={contextSelection}
          onChange={setContextSelection}
          onClose={() => setShowContextPanel(false)}
        />
      )}
    </div>
  );
}
