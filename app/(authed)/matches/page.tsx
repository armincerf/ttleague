import { fetchMatches } from "@/lib/actions/matches";
import PublicMatchList from "./PublicMatchList";
import PageLayout from "@/components/PageLayout";

export default async function MatchesPage() {
	const matches = await fetchMatches("recent");

	return (
		<PageLayout>
			<div className="container">
				<h1 className="text-2xl sm:text-3xl font-bold mb-4">Recent Matches</h1>
				<PublicMatchList serverMatches={matches} />
			</div>
		</PageLayout>
	);
}
