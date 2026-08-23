"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function IntimacyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Intimacy page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:bg-[#0F0A1A]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <AlertCircle
                size={32}
                className="text-red-600 dark:text-red-400"
              />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">
              Something went wrong
            </h1>

            <p className="text-muted mb-6">
              We encountered an error while loading your intimacy features. This
              might be a temporary issue.
            </p>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-gradient-to-r from-rose-500 to-purple-600 text-[var(--btn-primary-text)] rounded-2xl font-semibold hover:from-rose-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Try again</span>
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                Back to Dashboard
              </button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-muted cursor-pointer hover:text-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-muted overflow-auto">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
