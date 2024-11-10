import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Suspense } from "react";

export const metadata: Metadata = {
	title: "MK Table Tennis League",
	description: "Play in the Milton Keynes table tennis singles league",
};
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<Suspense fallback={<div>Loading auth content...</div>}>
			<ClerkProvider>
				<TopBar />
				<main className="pb-safe-area-inset-bottom md:container w-full mx-auto relative overflow-y-auto h-[100dvh]">
					{children}
				</main>
				<Suspense fallback={<div>Loading auth content...</div>}>
					<ClerkProvider dynamic>
						<BottomNav />
					</ClerkProvider>
				</Suspense>
			</ClerkProvider>
		</Suspense>
	);
}
