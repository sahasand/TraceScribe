// Auth disabled for local testing
// To re-enable: uncomment clerkMiddleware code below and remove the pass-through

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pass-through middleware for local testing (no auth)
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Original Clerk middleware (commented out for local testing):
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     const { userId } = await auth();
//     if (!userId) {
//       const signInUrl = new URL("/sign-in", request.url);
//       signInUrl.searchParams.set("redirect_url", request.url);
//       return Response.redirect(signInUrl);
//     }
//   }
// });

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
