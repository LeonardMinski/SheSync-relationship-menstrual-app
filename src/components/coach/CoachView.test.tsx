import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CoachView from "./CoachView";
import { useAuth } from "@/context/AuthContext";
import { useCoachWorkspace } from "@/hooks/useCoachWorkspace";
import { usePatterns } from "@/hooks/usePatterns";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/useCoachWorkspace", () => ({ useCoachWorkspace: vi.fn() }));
vi.mock("@/hooks/usePatterns", () => ({ usePatterns: vi.fn() }));

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
  window.localStorage.clear();
  vi.mocked(usePatterns).mockReturnValue({ observations: [], loading: false, error: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useAuth).mockReturnValue({ user: { id: "user-1", name: "Person" } } as any);
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

  it("shows both the AI-active pill and the private-to-you privacy chip", () => {
    mockWorkspace();
    render(<CoachView />);

    expect(screen.getByText("AI Coach Active")).toBeInTheDocument();
    expect(screen.getByText(/private to you/i)).toBeInTheDocument();
    expect(screen.getByText(/not shared with your partner/i)).toBeInTheDocument();
  });

  it("shows the context strip with a Manage context entry point above the composer", () => {
    mockWorkspace();
    render(<CoachView />);

    expect(screen.getByText("Manage context")).toBeInTheDocument();
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

  it("shows a distinct 'thinking' composer placeholder while sending", () => {
    mockWorkspace({ activeConversationId: "c1", messages: [USER_MSG], sending: true });
    render(<CoachView />);

    expect(screen.getByPlaceholderText("Coach is thinking...")).toBeInTheDocument();
  });
});

describe("CoachView — Previous Conversations panel", () => {
  it("opens the history panel and reopens a real conversation from it", () => {
    const openConversation = vi.fn();
    mockWorkspace({
      conversations: [
        { id: "c1", title: "Earlier chat", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", preview: null },
      ],
      openConversation,
    });
    render(<CoachView />);

    fireEvent.click(screen.getByLabelText("Previous conversations"));
    expect(screen.getByText("Earlier chat")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Earlier chat"));
    expect(openConversation).toHaveBeenCalledWith("c1");
  });

  it("shows an honest empty list rather than fabricated example history", () => {
    mockWorkspace({ conversations: [] });
    render(<CoachView />);

    fireEvent.click(screen.getByLabelText("Previous conversations"));

    expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
  });
});

describe("CoachView — Recent Observations wired to real Pattern Engine data", () => {
  const SAMPLE_OBSERVATION = {
    id: "obs-1",
    type: "period_duration_range",
    title: "Period Duration",
    statement: "Your recent periods have lasted 4 to 6 days.",
    evidence: { periodsConsidered: 3, minDays: 4, maxDays: 6 },
    sufficiency: "sufficient",
    window: { description: "Last 3 logged periods" },
    generatedAt: "2026-09-01T00:00:00.000Z",
  } as const;

  it("does not list Recent Observations in the context strip when the caller has no real observations yet", () => {
    mockWorkspace();
    vi.mocked(usePatterns).mockReturnValue({ observations: [], loading: false, error: null });
    render(<CoachView />);

    expect(screen.queryByText(/recent observations/i)).not.toBeInTheDocument();
  });

  it("lists Recent Observations in the context strip once real Pattern Engine data exists", () => {
    mockWorkspace();
    vi.mocked(usePatterns).mockReturnValue({ observations: [SAMPLE_OBSERVATION], loading: false, error: null });
    render(<CoachView />);

    expect(screen.getByText(/recent observations/i)).toBeInTheDocument();
  });

  it("keeps the Recent Observations toggle disabled in Manage Context when there is no real data yet", () => {
    mockWorkspace();
    vi.mocked(usePatterns).mockReturnValue({ observations: [], loading: false, error: null });
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(screen.getByLabelText("Recent observations")).toBeDisabled();
  });

  it("enables the Recent Observations toggle in Manage Context once real data exists", () => {
    mockWorkspace();
    vi.mocked(usePatterns).mockReturnValue({ observations: [SAMPLE_OBSERVATION], loading: false, error: null });
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(screen.getByLabelText("Recent observations")).not.toBeDisabled();
  });

  it("still never exposes Vault, partner messages, or private relationship reflections regardless of Pattern Engine data", () => {
    mockWorkspace();
    vi.mocked(usePatterns).mockReturnValue({ observations: [SAMPLE_OBSERVATION], loading: false, error: null });
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(screen.getByText("Vault entries")).toBeInTheDocument();
    expect(screen.getByText("Partner messages and replies")).toBeInTheDocument();
    expect(screen.getByText("Private relationship reflections")).toBeInTheDocument();
  });
});

describe("CoachView — context selection persists per user, not just for the session", () => {
  it("persists a saved context selection to localStorage keyed by the current user", () => {
    mockWorkspace();
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));
    fireEvent.click(screen.getByLabelText("Daily check-ins"));
    fireEvent.click(screen.getByText("Save Changes"));

    const stored = JSON.parse(window.localStorage.getItem("shesync-coach-context:user-1") ?? "null");
    expect(stored).toEqual({ dailyCheckIns: false, cycleContext: true, periodHistory: true, recentObservations: true });
  });

  it("restores a previously saved choice on the next mount instead of silently reverting to defaults", () => {
    window.localStorage.setItem(
      "shesync-coach-context:user-1",
      JSON.stringify({ dailyCheckIns: false, cycleContext: false, periodHistory: true, recentObservations: true }),
    );
    mockWorkspace();
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(screen.getByLabelText("Daily check-ins")).not.toBeChecked();
    expect(screen.getByLabelText("Cycle context")).not.toBeChecked();
    expect(screen.getByLabelText("Period history")).toBeChecked();
  });

  it("keeps a different user's saved context choice separate — a shared browser can't leak one account's preference into another's", () => {
    window.localStorage.setItem(
      "shesync-coach-context:someone-else",
      JSON.stringify({ dailyCheckIns: false, cycleContext: false, periodHistory: false, recentObservations: false }),
    );
    mockWorkspace();
    render(<CoachView />);

    fireEvent.click(screen.getByText("Manage context"));

    expect(screen.getByLabelText("Daily check-ins")).toBeChecked();
    expect(screen.getByLabelText("Cycle context")).toBeChecked();
    expect(screen.getByLabelText("Period history")).toBeChecked();
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
