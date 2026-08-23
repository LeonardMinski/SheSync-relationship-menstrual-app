import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const placeholderValues = new Set([
  "your_supabase_project_url",
  "your_supabase_url",
  "your_supabase_anon_key",
  "placeholder",
  "placeholder-anon-key",
  "https://placeholder.supabase.co",
]);

const validateEnvValue = (value: string | undefined, key: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (placeholderValues.has(value.trim().toLowerCase())) {
    throw new Error(
      `Invalid environment configuration for ${key}. Replace placeholder values before starting the app.`,
    );
  }

  return value;
};

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return validateEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return validateEnvValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  },
  get OPENAI_API_KEY() {
    return process.env.OPENAI_API_KEY;
  },
  get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
};

export const isValidSupabaseConfig = () => {
  try {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(supabaseUrl && supabaseAnonKey);
  } catch {
    return false;
  }
};

export const getValidatedEnv = () =>
  envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
