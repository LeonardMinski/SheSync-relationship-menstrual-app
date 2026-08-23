import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.STRIPE_SECRET_KEY ||= "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_mock";
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key";
(globalThis as typeof globalThis & { jest: typeof vi }).jest = vi;

vi.mock("stripe", () => {
  const Stripe = vi.fn() as ReturnType<typeof vi.fn> & {
    errors: {
      StripeError: new (message?: string) => Error;
    };
  };
  Stripe.errors = {
    StripeError: class StripeError extends Error {},
  };
  return {
    default: Stripe,
  };
});

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
  redirect: vi.fn(),
}));

// Mock Next.js cache functions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
