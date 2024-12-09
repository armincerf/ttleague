import { Suspense } from "react";
import { RankingSystem } from "./RankingSystem";

export default function RankingSystemPage() {
	return (
		<div className="container max-w-4xl mx-auto py-8">
			<h1 className="text-2xl font-bold mb-6">Ranking System Management</h1>
			<Suspense fallback={<div>Loading...</div>}>
				<RankingSystem />
			</Suspense>
		</div>
	);
}
