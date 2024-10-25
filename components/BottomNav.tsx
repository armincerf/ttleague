"use client";

import { useTokenCheck } from "@/hooks/use-token-check";
import { client } from "@/lib/triplit";
import { useAuth } from "@clerk/nextjs";
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
	{ icon: FaComments, label: "Chat", href: "/chat" },
];

export default function BottomNav() {
	const pathname = usePathname();

	//useTokenCheck();
	return (
		<div className="fixed bottom-0 left-0 z-40 w-full bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600 pb-safe-area-inset-bottom">
			<div className="grid h-16 max-w-lg grid-cols-5 mx-auto font-medium">
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
