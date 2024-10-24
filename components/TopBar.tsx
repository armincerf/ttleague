"use client";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

export default function TopBar() {
	const { isSignedIn } = useUser();
	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 h-16 flex items-center">
				<div className="w-[100px] flex items-center">
					{isSignedIn ? <UserButton /> : <SignInButton />}
				</div>

				<div className="flex-grow flex justify-center">
					<Logo className="h-8 w-[100px]" />
				</div>

				<div className="w-[100px] flex justify-end">
					<button className="p-2" type="button">
						<HelpCircle className="h-6 w-6 text-gray-600" />
					</button>
				</div>
			</div>
		</header>
	);
}
