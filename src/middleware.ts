import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/',
  '/ai-coach',
  '/fantasy',
  '/intimacy',
  '/settings',
  '/api/log-cycle',
  '/api/cycle',
  '/api/intimacy',
  '/api/fantasy',
  '/api/ai-coach',
  '/api/partner',
  '/api/user',
  '/api/shared'
]

// Define auth routes that should redirect to home if already authenticated
const authRoutes = [
  '/auth/login',
  '/auth/signup'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Get the token from cookies
  const token = request.cookies.get('sb-access-token')?.value || 
                request.cookies.get('supabase-auth-token')?.value

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If it's an auth route and has token, redirect to home
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Allow the request to continue
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
