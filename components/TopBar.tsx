"use client";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { HelpCircle, Loader2 } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "./ConnectionStatus";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { HelpModal } from "./HelpModal";

export default function TopBar({
	logoType,
}: {
	logoType?: "scoreboard" | "rankings" | "matches" | "coaches";
}) {
	const { isSignedIn, isLoaded } = useUser();
	const [open, setOpen] = useState(false);
	const [isHelpOpen, setIsHelpOpen] = useState(false);

	return (
		<>
			<header className="bg-white shadow-sm sticky top-0 z-50 w-full">
				<div className="container mx-auto px-4 h-16 flex items-center">
					<div className="w-[100px] flex items-center">
						{isLoaded && isSignedIn ? (
							<UserButton />
						) : isLoaded && !isSignedIn ? (
							<Popover open={open} onOpenChange={setOpen}>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="text-sm font-medium text-gray-700 hover:text-gray-900"
									>
										Sign in/Sign up
									</button>
								</PopoverTrigger>
								<PopoverContent className="w-80">
									<div className="space-y-4">
										<div className="text-lg font-semibold">
											Let's get you started
										</div>
										<p className="text-sm text-muted-foreground">
											Do you have an account already?
										</p>
										<div className="flex flex-col gap-4">
											<SignInButton mode="modal">
												<button
													type="button"
													className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
													onClick={() => setOpen(false)}
												>
													Sign in
												</button>
											</SignInButton>
											<SignUpButton mode="modal">
												<button
													type="button"
													className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10"
													onClick={() => setOpen(false)}
												>
													Sign up
												</button>
											</SignUpButton>
										</div>
									</div>
								</PopoverContent>
							</Popover>
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
						<button
							type="button"
							className="p-2"
							onClick={() => setIsHelpOpen(true)}
						>
							<HelpCircle className="h-6 w-6 text-gray-600" />
						</button>
					</div>
				</div>
			</header>

			<HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
		</>
	);
}
