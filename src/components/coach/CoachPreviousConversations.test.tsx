import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CoachPreviousConversations } from "./CoachPreviousConversations";
import type { CoachConversationSummary } from "@/types/coach";

const CONVERSATIONS: CoachConversationSummary[] = [
  { id: "c1", title: "Talking through work stress", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", preview: null },
  { id: "c2", title: null, createdAt: "2026-08-30T00:00:00.000Z", updatedAt: "2026-08-30T00:00:00.000Z", preview: "How have I been sleeping" },
];

describe("CoachPreviousConversations", () => {
  it("shows an honest empty state, never a fabricated example history", () => {
    render(
      <CoachPreviousConversations conversations={[]} activeConversationId={null} loading={false} onOpen={vi.fn()} onNew={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
  });

  it("renders each conversation's real title, falling back to its preview when untitled", () => {
    render(
      <CoachPreviousConversations
        conversations={CONVERSATIONS}
        activeConversationId={null}
        loading={false}
        onOpen={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Talking through work stress")).toBeInTheDocument();
    expect(screen.getByText("How have I been sleeping")).toBeInTheDocument();
  });

  it("reopens a conversation on click", () => {
    const onOpen = vi.fn();
    render(
      <CoachPreviousConversations conversations={CONVERSATIONS} activeConversationId={null} loading={false} onOpen={onOpen} onNew={vi.fn()} onDelete={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Talking through work stress"));

    expect(onOpen).toHaveBeenCalledWith("c1");
  });

  it("starts a new conversation via the New button", () => {
    const onNew = vi.fn();
    render(
      <CoachPreviousConversations conversations={CONVERSATIONS} activeConversationId={null} loading={false} onOpen={vi.fn()} onNew={onNew} onDelete={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("New"));

    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("requires an explicit confirm before deleting — the first click never deletes", () => {
    const onDelete = vi.fn();
    render(
      <CoachPreviousConversations conversations={CONVERSATIONS} activeConversationId={null} loading={false} onOpen={vi.fn()} onNew={vi.fn()} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByLabelText(/delete conversation: talking through work stress/i));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Delete this conversation?")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });

  it("cancel dismisses the confirmation without deleting", () => {
    const onDelete = vi.fn();
    render(
      <CoachPreviousConversations conversations={CONVERSATIONS} activeConversationId={null} loading={false} onOpen={vi.fn()} onNew={vi.fn()} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByLabelText(/delete conversation: talking through work stress/i));
    fireEvent.click(screen.getByText("Cancel"));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete this conversation?")).not.toBeInTheDocument();
  });
});
