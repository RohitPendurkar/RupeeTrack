import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api")) {
    const authCookie = request.cookies.get("next-auth.session-token")
    if (!authCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
