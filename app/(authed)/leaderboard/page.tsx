import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";

function LeaderboardPage() {
	return (
		<PageLayout>
			<h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
			<LeaderboardTable />
		</PageLayout>
	);
}

export default LeaderboardPage;
