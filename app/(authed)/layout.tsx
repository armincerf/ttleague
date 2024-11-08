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
			<ClerkProvider dynamic>
				<div className="flex flex-col h-[100dvh]">
					<TopBar />
					<main className="pb-safe-area-inset-bottom md:container w-full mx-auto overflow-y-auto h-[calc(100%-128px)] relative">
						{children}
					</main>
					<Suspense fallback={<div>Loading auth content...</div>}>
						<ClerkProvider dynamic>
							<BottomNav />
						</ClerkProvider>
					</Suspense>
				</div>
			</ClerkProvider>
		</Suspense>
	);
}
