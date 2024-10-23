import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEvents } from "@/lib/actions/events";
import { fetchMatches } from "@/lib/actions/matches";
import type { Event } from "@/triplit/schema";
import Link from "next/link";

function InProgressEvent({ event }: { event: Event }) {
	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<h3 className="text-lg font-semibold mb-2">{event.name}</h3>
				<p>Started at: {new Date(event.start_time).toLocaleString()}</p>
				<Link
					href={`/leagues/${event.league_id}/events/${event.id}`}
					className="text-blue-500 hover:underline"
				>
					View Event
				</Link>
			</CardContent>
		</Card>
	);
}

function InProgressMatch({
	leagueId,
	match,
}: {
	leagueId: string;
	match: NonNullable<Awaited<ReturnType<typeof fetchMatches>>>[number];
}) {
	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<h3 className="text-lg font-semibold mb-2">Match in Progress</h3>
				<p>
					Player 1: {match.player1?.first_name} {match.player1?.last_name}
				</p>
				<p>
					Player 2: {match.player2?.first_name} {match.player2?.last_name}
				</p>
				<Link
					href={`/leagues/${leagueId}/events/${match.event_id}/matches/${match.id}`}
					className="text-blue-500 hover:underline"
				>
					View Match
				</Link>
			</CardContent>
		</Card>
	);
}

export default function InProgressSection({ leagueId }: { leagueId: string }) {
	const inProgressEvents = use(fetchEvents(leagueId));
	const inProgressMatches = use(fetchMatches(leagueId));

	if (inProgressEvents.length === 0 && inProgressMatches.length === 0) {
		return null;
	}

	return (
		<section className="mb-8">
			<h2 className="text-2xl font-bold mb-4">In Progress</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{inProgressEvents.map((event) => (
					<InProgressEvent key={event.id} event={event} />
				))}
				{inProgressMatches.map((match) => (
					<InProgressMatch key={match.id} leagueId={leagueId} match={match} />
				))}
			</div>
		</section>
	);
}
