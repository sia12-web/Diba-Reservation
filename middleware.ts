import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export async function middleware(request: NextRequest) {
    const ip = (request as any).ip || '127.0.0.1';
    const path = request.nextUrl.pathname;

    // Rate limiting for reservation creation
    if (path === '/api/reservations/create') {
        const now = Date.now();
        const limitInfo = rateLimitMap.get(ip) || { count: 0, lastReset: now };

        if (now - limitInfo.lastReset > 60000) {
            limitInfo.count = 0;
            limitInfo.lastReset = now;
        }

        limitInfo.count++;
        rateLimitMap.set(ip, limitInfo);

        if (limitInfo.count > 5) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                { status: 429 }
            );
        }
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    const isLoginRoute = path === '/admin/login';
    const isAdminRoute = path.startsWith('/admin');

    if (isAdminRoute && !isLoginRoute && !session) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isLoginRoute && session) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/api/reservations/create'],
};
