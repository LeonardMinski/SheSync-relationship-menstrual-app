import LoadingSpinner from '@/components/LoadingSpinner'

export default function IntimacyLoading() {
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:bg-[#0F0A1A]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-8">
          {/* Boundaries Section */}
          <div className="card dark:card p-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Today's Card Section */}
          <div className="card dark:card p-6">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="elevated p-4 rounded-xl">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="card dark:card p-6">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
