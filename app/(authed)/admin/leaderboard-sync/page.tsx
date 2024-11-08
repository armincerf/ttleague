import { LeaderboardSync } from "./LeaderboardSync";
import { Suspense } from "react";
export default function LeaderboardSyncPage() {
	return (
		<div>
			<h1>Leaderboard Sync</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<LeaderboardSync />
			</Suspense>
		</div>
	);
}
