import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";
import { httpClient } from "@/lib/triplitServerClient";

async function getInitialUsers() {
	const client = httpClient();
	const query = client.query("users").order("rating", "DESC").limit(10).build();

	return client.fetch(query);
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
