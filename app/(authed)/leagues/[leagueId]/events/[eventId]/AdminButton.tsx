import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

interface AdminButtonProps {
	children: ReactNode;
}

async function AdminButtonContents({ children }: AdminButtonProps) {
	const { userId } = await auth();
	if (!userId) {
		return null;
	}
	return (
		<div className="absolute bottom-4 right-4">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="destructive"
						size="icon"
						className="rounded-full h-14 w-14"
					>
						Admin
					</Button>
				</PopoverTrigger>
				<PopoverContent side="top" className="w-80">
					{children}
				</PopoverContent>
			</Popover>
		</div>
	);
}

export function AdminButton({ children }: AdminButtonProps) {
	return (
		<ClerkProvider dynamic>
			<AdminButtonContents>{children}</AdminButtonContents>
		</ClerkProvider>
	);
}
