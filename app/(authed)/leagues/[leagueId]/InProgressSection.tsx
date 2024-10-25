import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchEvents } from "@/lib/actions/events";
import type { Event } from "@/triplit/schema";
import Link from "next/link";

function InProgressEvent({ event }: { event: Event }) {
	return (
		<Card className="mb-4">
			<CardContent className="pt-6">
				<h3 className="text-lg font-semibold mb-2">{event.name}</h3>
				<p>Started at: {new Date(event.start_time).toLocaleString()}</p>
				<Link
					href={`/events/${event.id}`}
					className="text-blue-500 hover:underline"
				>
					View Event
				</Link>
			</CardContent>
		</Card>
	);
}
function fetchInProgressEvents(leagueId: string) {
	return fetchEvents(leagueId).then((events) =>
		events.filter((event) => event.start_time < new Date()),
	);
}

export default function InProgressSection({ leagueId }: { leagueId: string }) {
	const inProgressEvents = use(fetchInProgressEvents(leagueId));

	if (inProgressEvents.length === 0) {
		return null;
	}

	return (
		<section className="mb-8">
			<h2 className="text-2xl font-bold mb-4">In Progress</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{inProgressEvents.map((event) => (
					<InProgressEvent key={event.id} event={event} />
				))}
			</div>
		</section>
	);
}
