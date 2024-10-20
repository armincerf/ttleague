import { UserButton } from "@clerk/nextjs";
import { HelpCircle } from "lucide-react";
import Logo from "./Logo";

export default function TopBar() {
	return (
		<header className="bg-white shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 h-16 flex items-center justify-between">
				<div className="w-4">
					<UserButton />
				</div>
				<Logo className="h-8 w-[100px]" />
				<button className="p-2" type="button">
					<HelpCircle className="h-6 w-6 text-gray-600" />
				</button>
			</div>
		</header>
	);
}
