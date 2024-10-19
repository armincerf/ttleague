import LeaderboardTable from "@/components/LeaderboardTable";

export default function LeaderboardPage() {
	return (
		<div className="h-[calc(100dvh-128px)] flex flex-col px-4 py-8 pb-0">
			<h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
			<LeaderboardTable />
		</div>
	);
}
