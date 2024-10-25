import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

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
		<ClerkProvider>
			<main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
				{children}
			</main>
		</ClerkProvider>
	);
}
