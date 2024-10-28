"use client";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { HelpCircle, Loader2 } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "./ConnectionStatus";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export default function TopBar({
	logoType,
}: {
	logoType?: "scoreboard" | "rankings" | "matches" | "coaches";
}) {
	const { isSignedIn, isLoaded } = useUser();
	return (
		<header className="bg-white shadow-sm sticky top-0 z-50 w-full">
			<div className="container mx-auto px-4 h-16 flex items-center">
				<div className="w-[100px] flex items-center">
					{isLoaded && isSignedIn ? (
						<UserButton />
					) : isLoaded && !isSignedIn ? (
						<Dialog>
							<DialogTrigger asChild>
								<button
									type="button"
									className="text-sm font-medium text-gray-700 hover:text-gray-900"
								>
									Sign in
								</button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[425px]">
								<DialogHeader>
									<DialogTitle>Let's get you started</DialogTitle>
									<DialogDescription>
										Do you have an account already?
									</DialogDescription>
								</DialogHeader>
								<div className="flex flex-col gap-4 mt-4">
									<SignInButton mode="modal">
										<button
											type="button"
											className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
										>
											Sign in
										</button>
									</SignInButton>
									<SignUpButton mode="modal">
										<button
											type="button"
											className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10"
										>
											Sign up
										</button>
									</SignUpButton>
								</div>
							</DialogContent>
						</Dialog>
					) : (
						<div className="w-full h-full flex">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					)}
				</div>

				<div className="flex-grow flex justify-center">
					<Logo className="h-8 w-[140px]" type={logoType} />
				</div>

				<div className="w-[100px] flex justify-end">
					<ConnectionStatus showUser={false} />
					<button type="button" className="p-2">
						<HelpCircle className="h-6 w-6 text-gray-600" />
					</button>
				</div>
			</div>
		</header>
	);
}
