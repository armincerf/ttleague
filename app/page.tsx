"use client";
import {
	ClerkProvider,
	SignedIn,
	SignedOut,
	SignInButton,
	SignUpButton,
} from "@clerk/nextjs";

export default function Home() {
	return (
		<ClerkProvider
			publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}
		>
			<SignedOut>
				<div className="flex flex-col items-center justify-center min-h-screen gap-4">
					<h1 className="text-2xl font-bold mb-4">Welcome to Our App</h1>
					<div className="flex gap-4">
						<SignInButton mode="modal">
							<button
								type="button"
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Sign In
							</button>
						</SignInButton>
						<SignUpButton mode="redirect">
							<button
								type="button"
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								Sign Up
							</button>
						</SignUpButton>
					</div>
				</div>
			</SignedOut>
			<SignedIn>
				<div>Signed In</div>
			</SignedIn>
		</ClerkProvider>
	);
}
