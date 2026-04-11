import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware handles:
 * 1. Session refresh on every request (keeps auth cookies alive).
 * 2. Route protection — redirects unauthenticated users to /login.
 * 3. Role-based access — prevents Developers from accessing /admin routes.
 * 4. Redirects logged-in users away from auth pages.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 1. Fetch membership once if user is logged in
  let membership = null;
  if (user) {
    const { data } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    membership = data;
  }

  // Auth pages — redirect already logged-in users away
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup');
  if (isAuthPage && user) {
    if (membership) {
        return membership.role === 'admin' 
          ? NextResponse.redirect(new URL('/admin', request.url))
          : NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Redirect users away from onboarding if already joined an org
  if (path.startsWith('/onboarding') && user && membership) {
     return membership.role === 'admin' 
          ? NextResponse.redirect(new URL('/admin', request.url))
          : NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected routes — require login
  const isProtected = !isAuthPage;
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect root to dashboard if logged in
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin routes — only allow admin members
  if (user && path.startsWith('/admin')) {
    if (!membership || membership.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
