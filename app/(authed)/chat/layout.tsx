"use client";

import { usePathname } from "next/navigation";

import { ClerkProvider } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ChatListComponent = dynamic(() => import("@/components/ChatList"), {
	ssr: false,
	loading: () => <Skeleton className="w-full h-full" />,
});

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const convoHasBeenSelected = pathname !== "/chat";
	return (
		<ClerkProvider dynamic>
			<div className="flex items-stretch h-full">
				<div
					className={`md:basis-2/12 ${
						convoHasBeenSelected ? "hidden md:block" : "w-full"
					}`}
				>
					<ChatListComponent />
				</div>
				<div className={`grow ${!convoHasBeenSelected && "hidden md:block"}`}>
					{children}
				</div>
			</div>
		</ClerkProvider>
	);
}
