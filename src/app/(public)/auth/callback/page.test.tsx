import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { supabase } from "@/lib/supabase/client";

import AuthCallback from "./page";

const exchangeCodeForSession = supabase.auth.exchangeCodeForSession as Mock;
const getSession = supabase.auth.getSession as Mock;

function setSearch(query = "") {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as ReturnType<typeof useSearchParams>,
  );
}

function setLocation(search = "", hash = "") {
  window.history.replaceState(null, "", `/auth/callback${search}${hash}`);
}

describe("AuthCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocation();
    setSearch();
  });

  it("shows a processing state before resolving", () => {
    getSession.mockReturnValue(new Promise(() => {})); // never resolves
    setSearch();

    render(<AuthCallback />);

    expect(screen.getByText(/confirming your email/i)).toBeInTheDocument();
  });

  it("shows failure, never success, when the URL carries an error", async () => {
    setLocation("?error=access_denied&error_description=Link+expired");
    setSearch("error=access_denied&error_description=Link+expired");

    render(<AuthCallback />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/that link didn't work/i)).toBeInTheDocument();
    expect(screen.getByText("Link expired")).toBeInTheDocument();
    expect(screen.queryByText(/email confirmed/i)).not.toBeInTheDocument();
  });

  it("exchanges a PKCE code and shows success when it succeeds", async () => {
    setLocation("?code=abc123");
    setSearch("code=abc123");
    exchangeCodeForSession.mockResolvedValue({ error: null });

    render(<AuthCallback />);

    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
  });

  it("shows failure when exchanging the code fails, never a false success", async () => {
    setLocation("?code=bad-code");
    setSearch("code=bad-code");
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid or expired code" },
    });

    render(<AuthCallback />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Invalid or expired code")).toBeInTheDocument();
    expect(screen.queryByText(/^email confirmed$/i)).not.toBeInTheDocument();
  });

  it("falls back to checking session state for the implicit flow", async () => {
    setSearch();
    getSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    render(<AuthCallback />);

    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();
  });

  it("shows failure rather than a false success when no session ever appears", async () => {
    setSearch();
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(<AuthCallback />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/^email confirmed$/i)).not.toBeInTheDocument();
  });
});
