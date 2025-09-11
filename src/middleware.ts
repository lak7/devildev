import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/contact',
  '/community',
  '/sign-in(.*)', // Catch-all for sign-in routes
  '/sign-up(.*)', // Catch-all for sign-up routes
  '/about',
  '/api/webhook(.*)', // Clerk webhooks and other public API routes
  '/pricing',
  '/terms-and-conditions',
  '/privacy',
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's not a public route, protect it
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};