"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useOptionalAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/security", label: "Security" },
  { href: "/help", label: "Help Center" },
];

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cycle", label: "Cycle" },
  { href: "/partner", label: "Partner" },
  { href: "/settings/privacy", label: "Privacy" },
];

export function PublicBrand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "ss-display text-3xl font-bold tracking-tight text-[color:var(--design-brown)]",
        className,
      )}
    >
      SheSync+
    </Link>
  );
}

export function PublicHeader({
  showAppNav = true,
  className,
}: {
  showAppNav?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useOptionalAuth();
  const [fallbackAuthLoading, setFallbackAuthLoading] = useState(!auth);
  const [fallbackHasSession, setFallbackHasSession] = useState(false);

  useEffect(() => {
    if (auth) {
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setFallbackHasSession(Boolean(data.session));
      setFallbackAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setFallbackHasSession(Boolean(session));
      setFallbackAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [auth]);

  const authLoading = auth?.loading ?? fallbackAuthLoading;
  const isLoggedIn = Boolean(auth?.session ?? fallbackHasSession);
  const showAuthActions = !authLoading && !isLoggedIn;
  const showSignedInActions = !authLoading && isLoggedIn;

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    } else {
      await supabase.auth.signOut();
      setFallbackHasSession(false);
    }

    setMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[color:var(--design-border)] bg-[color:var(--design-surface)]",
        className,
      )}
    >
      <div className="mx-auto flex min-h-[88px] w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <PublicBrand />

        {showAppNav && (
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-10 text-sm font-bold tracking-[0.08em] text-[color:var(--design-ink)] md:flex"
          >
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href === "/settings/privacy" &&
                  pathname.startsWith("/settings"));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b-2 border-transparent py-1 transition-colors hover:text-[color:var(--design-brown)]",
                    active &&
                      "border-[color:var(--design-brown)] text-[color:var(--design-brown)]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {showAuthActions && (
          <div className="hidden items-center gap-4 text-base font-bold text-[color:var(--design-brown)] sm:flex">
            <Link
              href="/auth/login"
              className="transition-colors hover:text-[color:var(--design-ink)]"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--design-peach)] px-7 text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
            >
              Sign Up
            </Link>
          </div>
        )}

        {showSignedInActions && (
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden min-h-12 items-center justify-center gap-2 rounded-full border border-[color:var(--design-border)] bg-white px-6 text-base font-bold text-[color:var(--design-brown)] transition hover:border-[color:var(--design-brown)] hover:text-[color:var(--design-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] sm:inline-flex"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log Out
          </button>
        )}

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--design-border)] bg-white text-[color:var(--design-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[color:var(--design-border)] bg-[color:var(--design-surface)] px-5 py-4 md:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto grid max-w-7xl gap-2 text-sm font-bold tracking-[0.08em] text-[color:var(--design-ink)]"
          >
            {showAppNav &&
              navLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  (link.href === "/settings/privacy" &&
                    pathname.startsWith("/settings"));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 transition-colors hover:bg-[color:var(--design-footer)]",
                      active &&
                        "bg-[color:var(--design-footer)] text-[color:var(--design-brown)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            {showAuthActions && (
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[color:var(--design-border)] pt-4">
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--design-border)] bg-white text-[color:var(--design-brown)]"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--design-peach)] text-[color:var(--design-ink)]"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {showSignedInActions && (
              <div className="mt-2 border-t border-[color:var(--design-border)] pt-4">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--design-border)] bg-white text-[color:var(--design-brown)]"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  Log Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-[color:var(--design-border)] bg-[color:var(--design-footer)]",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <PublicBrand className="text-3xl" />

        <p className="text-sm font-semibold tracking-wide text-[color:var(--design-sage)]">
          © 2024 SheSync+. Your privacy is our priority.
        </p>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold tracking-[0.06em] text-[color:var(--design-ink)]"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[color:var(--design-brown)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
