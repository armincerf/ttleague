"use client";

import {
	useAdminActionListener,
	useCheckForOnboarding,
	useTokenCheck,
} from "@/hooks/use-token-check";
import { client } from "@/lib/triplit";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
	FaTable,
	FaUsers,
	FaTrophy,
	FaTableTennis,
	FaComments,
} from "react-icons/fa";

const navItems = [
	{ icon: FaTable, label: "Leaderboard", href: "/leaderboard" },
	{ icon: FaUsers, label: "Friendly", href: "/friendly" },
	{ icon: FaTrophy, label: "League", href: "/leagues/mk-ttl-singles" },
	{ icon: FaTableTennis, label: "Matches", href: "/matches" },
];

export default function BottomNav() {
	const pathname = usePathname();

	useTokenCheck();
	useAdminActionListener();
	const isHidden =
		pathname.includes("onboarding") || pathname.endsWith("/active");

	return (
		<div
			className={`bottom-0 left-0 z-40 w-full bg-white border-t border-gray-200 
				dark:bg-gray-700 dark:border-gray-600 pb-safe-area-inset-bottom
				${isHidden ? "hidden" : "sticky"}`}
		>
			<div className="grid h-16 max-w-lg grid-cols-4 mx-auto font-medium">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`inline-flex flex-col items-center justify-center px-2 group
              hover:bg-gray-50 dark:hover:bg-gray-800
              ${
								pathname === item.href
									? "text-blue-600 dark:text-blue-500"
									: "text-gray-500 dark:text-gray-400"
							}`}
					>
						<item.icon className="w-5 h-5 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500" />
						<span className="text-xs group-hover:text-blue-600 dark:group-hover:text-blue-500">
							{item.label}
						</span>
					</Link>
				))}
			</div>
		</div>
	);
}
