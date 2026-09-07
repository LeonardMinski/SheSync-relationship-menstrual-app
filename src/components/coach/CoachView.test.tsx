import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CoachView from "./CoachView";
import { useCoachWorkspace } from "@/hooks/useCoachWorkspace";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/hooks/useCoachWorkspace", () => ({ useCoachWorkspace: vi.fn() }));

const BASE_WORKSPACE = {
  conversations: [],
  loadingList: false,
  activeConversationId: null as string | null,
  messages: [] as unknown[],
  loadingConversation: false,
  sending: false,
  error: null as string | null,
  pendingContent: null as string | null,
  startNewConversation: vi.fn(),
  openConversation: vi.fn(),
  removeConversation: vi.fn(),
  sendUserMessage: vi.fn(),
  retry: vi.fn(),
};

function mockWorkspace(overrides: Partial<typeof BASE_WORKSPACE> = {}) {
  vi.mocked(useCoachWorkspace).mockReturnValue({ ...BASE_WORKSPACE, ...overrides } as ReturnType<typeof useCoachWorkspace>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CoachView — first visit / empty conversation", () => {
  it("makes the conversation workspace obvious: composer visible immediately", () => {
    mockWorkspace();
    render(<CoachView />);

    expect(screen.getByLabelText(/message coach/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("renders all four starter cards, each with an explicit, always-visible CTA", () => {
    mockWorkspace();
    render(<CoachView />);

    for (const cta of ["Explore pattern →", "Start conversation →", "Create partner context →", "Start reflection →"]) {
      expect(screen.getByText(cta)).toBeInTheDocument();
    }
    // No vague CTAs.
    expect(screen.queryByText(/^learn more$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^view$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^continue$/i)).not.toBeInTheDocument();
  });

  it("shows the private-to-you privacy chip", () => {
    mockWorkspace();
    render(<CoachView />);

    expect(screen.getByText(/private to you/i)).toBeInTheDocument();
    expect(screen.getByText(/not shared with your partner/i)).toBeInTheDocument();
  });

  it("clicking a starter card sends its associated prompt", () => {
    const sendUserMessage = vi.fn();
    mockWorkspace({ sendUserMessage });
    render(<CoachView />);

    fireEvent.click(screen.getByText("Start reflection →"));

    expect(sendUserMessage).toHaveBeenCalledWith(expect.stringMatching(/reflect/i), expect.any(Object));
  });
});

describe("CoachView — active conversation", () => {
  const USER_MSG = {
    id: "m1",
    conversationId: "c1",
    role: "user" as const,
    content: "How have I been feeling this week?",
    fromLogs: null,
    generalContext: null,
    questionToConsider: null,
    optionalNextStep: null,
    partnerTranslationAvailable: false,
    createdAt: "t1",
  };
  const ASSISTANT_MSG = {
    id: "m2",
    conversationId: "c1",
    role: "assistant" as const,
    content: "Here's what I noticed.",
    fromLogs: "Your recent check-ins show lower energy midweek.",
    generalContext: null,
    questionToConsider: null,
    optionalNextStep: null,
    partnerTranslationAvailable: true,
    createdAt: "t2",
  };

  it("renders sent and received messages", () => {
    mockWorkspace({ activeConversationId: "c1", messages: [USER_MSG, ASSISTANT_MSG] });
    render(<CoachView />);

    expect(screen.getByText("How have I been feeling this week?")).toBeInTheDocument();
    expect(screen.getByText(/your recent check-ins show lower energy/i)).toBeInTheDocument();
  });

  it("shows the thinking state while a reply is generating", () => {
    mockWorkspace({ activeConversationId: "c1", messages: [USER_MSG], sending: true });
    render(<CoachView />);

    expect(screen.getByRole("status")).toHaveTextContent(/thinking through your question/i);
  });

  it("shows the error state with a Retry action, and calls retry (not a resend requiring retyped text)", () => {
    const retry = vi.fn();
    mockWorkspace({ activeConversationId: "c1", messages: [USER_MSG], error: "boom", retry });
    render(<CoachView />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't generate a response/i);
    fireEvent.click(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("navigates to Partner Translation via the in-message CTA, never auto-sharing", () => {
    mockWorkspace({ activeConversationId: "c1", messages: [USER_MSG, ASSISTANT_MSG] });
    render(<CoachView />);

    fireEvent.click(screen.getByText(/turn this into partner context/i));

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("/connect/translate?insight="));
  });
});

describe("CoachView — copy audit", () => {
  const FORBIDDEN = [
    /biological rhythm/i,
    /biological context/i,
    /hormone peak/i,
    /progesterone/i,
    /estrogen/i,
    /bio-context/i,
    /end-to-end encrypted/i,
    /fully encrypted/i,
    /zero knowledge/i,
    /nothing is shared/i,
  ];

  it("never renders forbidden biological/hormonal or encryption-claim language in the empty state", () => {
    mockWorkspace();
    render(<CoachView />);

    const text = document.body.textContent ?? "";
    for (const phrase of FORBIDDEN) {
      expect(text).not.toMatch(phrase);
    }
  });

  it("never renders forbidden language in an active conversation", () => {
    mockWorkspace({
      activeConversationId: "c1",
      messages: [
        {
          id: "m1",
          conversationId: "c1",
          role: "assistant",
          content: "General note",
          fromLogs: null,
          generalContext: "Energy can vary for many reasons, including sleep, stress and cycle changes.",
          questionToConsider: null,
          optionalNextStep: null,
          partnerTranslationAvailable: false,
          createdAt: "t1",
        },
      ],
    });
    render(<CoachView />);

    const text = document.body.textContent ?? "";
    for (const phrase of FORBIDDEN) {
      expect(text).not.toMatch(phrase);
    }
  });
});
