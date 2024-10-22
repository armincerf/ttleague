import { Suspense } from "react";
import MatchListContent from "./MatchListContent";
import MatchListSkeleton from "./MatchListSkeleton";

type MatchListProps = {
	title: string;
	eventId: string;
	status: "in_progress" | "pending" | "completed";
};

export default function MatchList({ title, eventId, status }: MatchListProps) {
	return (
		<Suspense fallback={<MatchListSkeleton />}>
			<MatchListContent title={title} eventId={eventId} status={status} />
		</Suspense>
	);
}
