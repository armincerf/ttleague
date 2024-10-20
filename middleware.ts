import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectedRoutes = ["/admin", "/dashboard"];

function isProtectedRoute(path: string): boolean {
	return protectedRoutes.some((route) => path.startsWith(route));
}

export default clerkMiddleware(async (auth, request) => {
	const path = new URL(request.url).pathname;
	const { userId } = auth();

	if (isProtectedRoute(path)) {
		if (!userId) {
			return NextResponse.redirect(new URL("/sign-up", request.url));
		}
	}

	const response = NextResponse.next();
	if (userId) {
		const { getToken } = auth();
		const token = await getToken();

		// Create a new response with the token in the body

		// Attach the token to the response
		response.headers.set("x-auth-token", token ?? "");
	} else {
		response.headers.set("x-auth-token", process.env.TRIPLIT_ANON_TOKEN ?? "");
	}

	console.log("x-auth-token", response.headers.get("x-auth-token"));

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
