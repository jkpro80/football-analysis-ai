import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const loginPath = "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin/") &&
    pathname !== "/api/admin/login";

  const sessionToken =
    process.env.ADMIN_SESSION_TOKEN;

  const currentSession =
    request.cookies.get("admin_session")?.value;

  if (!sessionToken) {
    console.error(
      "ADMIN_SESSION_TOKEN is missing.",
    );

    if (isAdminApi) {
      return NextResponse.json(
        {
          detail:
            "Admin session configuration is missing.",
        },
        {
          status: 500,
        },
      );
    }

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
    if (isAdminApi) {
      return NextResponse.json(
        {
          detail: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.redirect(
      new URL(loginPath, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};

