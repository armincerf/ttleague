import { Suspense } from "react";

export default function MatchPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<div>Placeholder page</div>
		</Suspense>
	);
}
