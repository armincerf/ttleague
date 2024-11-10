"use client";
import { User } from "@/triplit/schema";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
	ssr: false,
	loading: () => <div>Loading bio...</div>,
});

export function UserBio({ user }: { user?: User }) {
	if (!user?.bio) return null;
	return (
		<div className="bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-4 mt-8">
			<h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
				Bio
			</h2>
			<div className="prose dark:prose-invert prose-slate max-w-none text-slate-800 dark:text-slate-200">
				<ReactMarkdown>{user.bio}</ReactMarkdown>
			</div>
		</div>
	)
}
