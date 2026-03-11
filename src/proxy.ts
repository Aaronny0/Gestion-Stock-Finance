import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';

export default async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        const isValid = await verifySession(token);
        if (!isValid) {
            throw new Error('Invalid token');
        }
    } catch {
        const response = NextResponse.redirect(new URL('/login', req.url));
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
