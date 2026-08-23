import Link from "next/link";
import { ArrowRight, Calendar, Heart, Shield, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-950 dark:bg-[#17121F] dark:text-white">
      <header className="border-b border-gray-200 px-4 py-5 dark:border-[#34263F]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">SheSync+</span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
              href="/auth/login"
            >
              Login
            </Link>
            <Link
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 text-sm font-semibold text-[var(--btn-primary-text)] shadow-lg shadow-rose-500/20 transition-transform hover:-translate-y-0.5"
              href="/auth/signup"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Cycle tracking with privacy-first partner sharing
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Log cycle data, see your dashboard, choose what your partner can
            view, and keep the MVP flow clear.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-5 font-semibold text-[var(--btn-primary-text)] shadow-lg shadow-rose-500/20 transition-transform hover:-translate-y-0.5"
              href="/auth/signup"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-gray-300 px-5 font-semibold text-gray-900 dark:border-[#34263F] dark:text-white"
              href="/auth/login"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Cycle Logging"
            description="Save phase, mood, energy, symptoms, and notes by cycle date."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Privacy Controls"
            description="Choose whether cycle phase, mood, and energy are visible to a partner."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Partner View"
            description="A read-only partner view that respects the privacy settings from the API."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-5 dark:border-[#34263F]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
