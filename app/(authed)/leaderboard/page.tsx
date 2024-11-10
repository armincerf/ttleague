import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";
import { httpClient } from "@/lib/triplitServerClient";

async function getInitialUsers() {
	const query = httpClient
		.query("users")
		.order("rating", "DESC")
		.limit(10)
		.build();

	return httpClient.fetch(query);
}

async function LeaderboardPage() {
	const initialUsers = await getInitialUsers();

	return (
		<PageLayout>
			<h1 className="text-xl font-bold mb-2">Leaderboard</h1>
			<LeaderboardTable initialUsers={initialUsers} />
		</PageLayout>
	);
}

export default LeaderboardPage;
