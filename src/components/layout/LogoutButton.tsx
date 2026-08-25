"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface LogoutButtonProps {
  onDone?: () => void;
}

export function LogoutButton({ onDone }: LogoutButtonProps) {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      onDone?.();
      router.replace("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[color:var(--design-border)] bg-white px-6 text-sm font-bold text-[color:var(--design-brown)] transition hover:border-[color:var(--design-brown)] hover:text-[color:var(--design-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{isSigningOut ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
