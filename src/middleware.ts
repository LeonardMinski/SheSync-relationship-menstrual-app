import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Define protected routes that require authentication
const protectedRoutes = [
  '/',
  '/cycle',
  '/coach',
  '/fantasy',
  '/intimacy',
  '/settings'
  // Removed API routes - they handle auth internally
]

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = [
  '/auth/login',
  '/auth/signup'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // For now, let's disable server-side auth checking and only handle auth routes
  // The client-side will handle authentication state
  
  // Only handle auth route redirects (if user is already logged in)
  if (isAuthRoute) {
    // Try to check if user is logged in, but don't block if it fails
    try {
      const response = NextResponse.next()
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set(name, value, options)
            },
            remove(name: string, options: any) {
              response.cookies.delete(name)
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      
      // If user is logged in and trying to access auth pages, redirect to home
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      return response
    } catch (error) {
      // If auth check fails, just continue to the auth page
      console.log('Auth check failed in middleware, continuing to auth page')
      return NextResponse.next()
    }
  }

  // For all other routes, just continue - let client-side handle auth
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
