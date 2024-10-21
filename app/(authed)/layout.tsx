import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

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
		<ClerkProvider>
			<div className="flex flex-col h-[100dvh]">
				<TopBar />
				<main className="pb-safe-area-inset-bottom flex-grow container mx-auto overflow-y-auto">
					{children}
				</main>
				<BottomNav />
			</div>
		</ClerkProvider>
	);
}
