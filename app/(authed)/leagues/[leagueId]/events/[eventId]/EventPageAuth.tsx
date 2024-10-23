import { Button } from "@/components/ui/button";
import type { fetchEvents } from "@/lib/actions/events";
import type { fetchMatches } from "@/lib/actions/matches";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import MatchListSkeleton from "./MatchListSkeleton";

type Props = {
	event: Awaited<ReturnType<typeof fetchEvents>>[number];
	matches: Awaited<ReturnType<typeof fetchMatches>>;
};

const EventRegistrationButton = dynamic(
	() => import("./EventRegistrationButton"),
	{
		ssr: false,
		loading: () => (
			<Button variant="outline" disabled>
				Loading...
			</Button>
		),
	},
);

const MatchList = dynamic(() => import("./MatchListContent"), {
	ssr: false,
	loading: () => <MatchListSkeleton />,
});

export function EventPageAuth({ event, matches }: Props) {
	const { user } = useUser();
	const userId = user?.id;

	const userMatches = matches.filter(
		(match) => match.player_1 === userId || match.player_2 === userId,
	);
	const nextMatch = userMatches.find((match) => match.status === "pending");
	const nextOpponent =
		nextMatch && nextMatch?.player_1 === userId
			? nextMatch.player2
			: nextMatch?.player1;
	const nextTable = nextMatch?.table_number;
	const tableMatches = matches.filter(
		(match) => match.table_number === nextTable,
	);
	const tableMatchInProgress = tableMatches.some(
		(match) => match.status === "confirmed" && !match.winner,
	);

	const myEventRegistration = event.registrations?.find(
		(registration) => registration.user_id === userId,
	);

	return (
		<>
			{matches && matches.length > 0 ? (
				<MatchList title={event.name} eventId={event.id} status="in_progress" />
			) : (
				<div>No matches found</div>
			)}

			{event.status === "scheduled" && (
				<EventRegistrationButton
					eventId={event.id}
					leagueId={event.league_id}
					serverEventRegistration={myEventRegistration}
				/>
			)}
		</>
	);
}
