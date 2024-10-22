import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";
import { httpClient } from "@/lib/triplitServerClient";
import { unstable_cache } from "next/cache";

// Next.js will invalidate the cache when a request comes in, at most once every 60 seconds.
export const revalidate = 60;

const getInitialUsers = unstable_cache(async () => {
	const query = httpClient
		.query("users")
		.order("rating", "DESC")
		.limit(10)
		.build();

	const results = await httpClient.fetch(query);
	return results;
}, ["leaderboard-users"]);

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
