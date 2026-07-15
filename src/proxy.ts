import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { boardOnlyRoles, ownerOnlyRoles } from "@/lib/roles";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (!req.auth && (pathname.startsWith("/dashboard") || pathname === "/onboarding")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (req.auth) {
    if (role === "pending" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
    }

    if (role !== "pending" && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (
    pathname.startsWith("/dashboard/owner") &&
    !ownerOnlyRoles.includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (
    pathname.startsWith("/dashboard/admin") &&
    !boardOnlyRoles.includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
