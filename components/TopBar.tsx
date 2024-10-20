"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

export default function TopBar() {
	const { isSignedIn } = useUser();
	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className={cn(!isSignedIn ? "w-24 p-0" : "w-4")}>
					{isSignedIn ? <UserButton /> : <SignInButton />}
				</div>
				<Logo className="h-8 w-[100px]" />
				<button className={cn("p-2", !isSignedIn ? "pl-8" : "pl-0")} type="button">
					<HelpCircle className="h-6 w-6 text-gray-600" />
				</button>
			</div>
		</header>
	);
}
