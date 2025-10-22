import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/contact',
  '/community',
  '/sign-in(.*)', // Catch-all for sign-in routes
  '/sign-up(.*)', // Catch-all for sign-up routes
  '/about',
  '/api/webhook',
  '/api/github/setup',
  '/api/webhook/:path*', // All webhooks should bypass Clerk
  '/api/github/callback',
  '/api/github/callback/:path*', // All webhooks should bypass Clerk
  '/api/github/mcp-auth',
  '/api/github/mcp-auth/:path*', // All webhooks should bypass Clerk
  '/pricing',
  '/terms-and-conditions',
  '/privacy',
  '/api/inngest',
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  // Hard bypass for all webhook routes as a safety net
  if (pathname.startsWith('/api/webhook')) {
    return;
  }
  // If it's not a public route, protect it
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes; webhook bypass is handled by isPublicRoute
    "/(api|trpc)(.*)",
  ],
};