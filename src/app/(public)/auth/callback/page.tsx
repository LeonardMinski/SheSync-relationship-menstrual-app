"use client";

import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-white dark:text-white mb-4">
          Email Confirmed!
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your email has been confirmed successfully. You can now log in to your
          account.
        </p>

        <Link
          href="/auth/login"
          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-[var(--btn-primary-text)] font-semibold py-3 px-6 rounded-xl hover:from-rose-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 inline-block"
        >
          Continue to Login
        </Link>

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
