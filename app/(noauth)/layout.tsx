import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata: Metadata = {
	title: "MK Table Tennis League - Sign Up",
	description: "Sign up to the Milton Keynes table tennis singles league",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ClerkProvider>
				<main className="h-[100dvh] bg-gray-100 flex flex-col items-center justify-center">
					{children}
				</main>
			</ClerkProvider>
		</Suspense>
	);
}
