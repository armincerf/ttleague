import {
	clerkMiddleware,
	createRouteMatcher,
	getAuth,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = createRouteMatcher(["/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, request) => {
	if (publicRoutes(request)) {
		const { userId } = auth();
		if (userId) {
			return NextResponse.redirect(new URL("/leaderboard", request.url));
		}
		return NextResponse.next();
	}

	// Check if the user is authenticated
	const { userId } = auth();
	if (!userId) {
		return NextResponse.redirect(new URL("/sign-up", request.url));
	}

	const { getToken } = auth();
	const token = await getToken();

	// Create a new response with the token in the body
	const response = NextResponse.next();

	// Attach the token to the response
	response.headers.set("x-auth-token", token ?? "");

	return response;
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
