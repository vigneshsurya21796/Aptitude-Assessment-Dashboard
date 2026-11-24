import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "27cd2aadb35f46de85f650fd7d8c1944347df09e6e9b776d7d5480e87c65080b";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login endpoints
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    // If admin is already authenticated and visits /admin/login, redirect to /admin/dashboard
    const token = request.cookies.get("admin_token")?.value;
    if (token && pathname === "/admin/login") {
      try {
        await jwtVerify(token, SECRET_KEY);
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } catch (err) {
        // Token invalid, proceed to login page
      }
    }
    return NextResponse.next();
  }

  // Protect /admin routes and /api/admin routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (isAdminRoute || isAdminApiRoute) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: "Unauthorized access. Executive credentials required." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (err) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: "Session expired or invalid. Please sign in again." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("admin_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
