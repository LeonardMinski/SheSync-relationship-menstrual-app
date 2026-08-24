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
      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{isSigningOut ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
