import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const loginPath = "/admin/login";
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;
  const currentSession =
    request.cookies.get("admin_session")?.value;

  if (!sessionToken) {
    console.error("ADMIN_SESSION_TOKEN is missing.");

    return NextResponse.redirect(
      new URL(loginPath, request.url),
    );
  }

  if (pathname === loginPath) {
    if (currentSession === sessionToken) {
      return NextResponse.redirect(
        new URL("/admin", request.url),
      );
    }

    return NextResponse.next();
  }

  if (currentSession !== sessionToken) {
    const loginUrl = new URL(loginPath, request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};