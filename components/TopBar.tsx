import { SignInButton, UserButton } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import Logo from "./Logo";
import { auth } from "@clerk/nextjs/server";
import { cn } from "@/lib/utils";

export default function TopBar() {
	const { userId } = auth();
	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className={cn(!userId ? "w-24 p-0" : "w-4")}>
					{userId ? <UserButton /> : <SignInButton />}
				</div>
				<Logo className="h-8 w-[100px]" />
				<button className={cn("p-2", !userId ? "pl-8" : "pl-0")} type="button">
					<HelpCircle className="h-6 w-6 text-gray-600" />
				</button>
			</div>
		</header>
	);
}
