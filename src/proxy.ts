import { NextResponse, type NextRequest } from "next/server";
// Authentication and permissions are checked by the session API before any business data is rendered.
export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  if (!request.nextUrl.pathname.startsWith("/_next/"))
    response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
