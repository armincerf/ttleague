import LeaderboardTable from "@/components/LeaderboardTable";
import PageLayout from "@/components/PageLayout";
import WIPAlertBanner from "@/components/WIPAlertBanner";
import { unstable_cacheTag as cacheTag } from "next/cache";
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
	"use cache";
	cacheTag("leaderboard-page");

	const initialUsers = await getInitialUsers();

	return (
		<PageLayout>
			<WIPAlertBanner />
			<h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
			<LeaderboardTable initialUsers={initialUsers} />
		</PageLayout>
	);
}

export default LeaderboardPage;
