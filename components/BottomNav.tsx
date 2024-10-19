"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, Settings } from "lucide-react";

const navItems = [
	{ icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
	{ icon: Calendar, label: "Events", href: "/events" },
	{ icon: Settings, label: "Settings", href: "/settings" },
];

export default function BottomNav() {
	const pathname = usePathname();

	return (
		<div className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600 pb-safe-area-inset-bottom">
			<div className="grid h-16 max-w-lg grid-cols-3 mx-auto font-medium">
				{navItems.map((item, index) => (
					<Link
						key={item.href}
						href={item.href}
						className={`inline-flex flex-col items-center justify-center px-5 group
              ${index === 0 || index === navItems.length - 1 ? "border-x" : ""}
              border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600
              ${pathname === item.href ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"}`}
					>
						<item.icon className="w-5 h-5 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
						<span className="text-sm group-hover:text-blue-600 dark:group-hover:text-blue-500">
							{item.label}
						</span>
					</Link>
				))}
			</div>
		</div>
	);
}
