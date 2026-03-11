import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vortex_super_secret_key_2026_es_store'
)

const SESSION_COOKIE = 'vortex_session'

export async function updateSession(request: NextRequest) {
  // Verify custom JWT token
  let user = null
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = payload
    } catch {
      user = null
    }
  }

  const pathname = request.nextUrl.pathname;

  // Protect all routes except /login, /favicon, public assets, and api
  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/favicon') &&
    !pathname.startsWith('/api') &&
    !pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
  ) {
    // Redirect to login if unauthenticated
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access /login, redirect to /
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
