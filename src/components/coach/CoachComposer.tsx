"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

import { COACH_COMPOSER_PLACEHOLDER } from "./coach.constants";

/**
 * The primary control on this screen. Enter sends (Shift+Enter for a
 * newline, standard chat convention); the send button is always present
 * as an equivalent action for anyone not using that shortcut.
 */
export function CoachComposer({
  onSend,
  disabled,
  autoFocus,
  placeholder = COACH_COMPOSER_PLACEHOLDER,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-3 rounded-[1.5rem] border border-border bg-bg-surface p-3 shadow-sm">
      <label htmlFor="coach-composer" className="sr-only">
        Message Coach
      </label>
      <textarea
        id="coach-composer"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
        autoFocus={autoFocus}
        className="min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-purple)] text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
