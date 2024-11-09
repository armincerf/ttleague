"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/hooks/useUser";
import dynamic from "next/dynamic";
import MatchListSkeleton from "./MatchListSkeleton";
import type { Event } from "@/lib/actions/events";
import Link from "next/link";
import { client } from "@/lib/triplit";
import { useQueryOne } from "@triplit/react";

type Props = {
	event: NonNullable<Event>;
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

export function EventPageAuth({ event }: Props) {
	const { user } = useUser();
	const userId = user?.id;

	const matches = event.matches;

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

	const { result: myEventRegistration } = useQueryOne(
		client,
		client.query("event_registrations").where([
			["event_id", "=", event.id],
			["user_id", "=", userId || ""],
		]),
	);

	return (
		<>
			{matches && matches.length > 0 ? (
				<MatchList event={event} status="in_progress" />
			) : (
				<div>No matches found</div>
			)}

			{event.status === "active" && myEventRegistration && (
				<Link href={`/events/${event.id}/active`}>
					<Button>Join Event!</Button>
				</Link>
			)}

			<EventRegistrationButton
				eventId={event.id}
				leagueId={event.league_id}
				serverEventRegistration={myEventRegistration}
			/>
		</>
	);
}
