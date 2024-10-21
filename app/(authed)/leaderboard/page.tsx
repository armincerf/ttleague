import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";
import { client } from "@/lib/triplit";

async function getInitialUsers() {
	const query = client.query("users").order("rating", "DESC").limit(10).build();

	const results = await client.http.fetch(query);
	return results;
}

async function LeaderboardPage() {
	const initialUsers = await getInitialUsers();

	return (
		<PageLayout>
			<h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
			<LeaderboardTable initialUsers={initialUsers} />
		</PageLayout>
	);
}

export default LeaderboardPage;
