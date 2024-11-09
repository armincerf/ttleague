import { Card, CardContent } from "@/components/ui/card";
import { fetchEvents } from "@/lib/actions/events";
import Link from "next/link";
import type { Event } from "@/lib/actions/events";
import { auth, currentUser } from "@clerk/nextjs/server";
import ActiveEvent from "./GoToActiveEvent";

async function InProgressEvent({ event }: { event: Event }) {
	const user = await currentUser();
	if (!user || !event) {
		return null;
	}
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
				{event.status === "active" &&
					event.registrations.find((r) => r.user_id === user.id) && (
						<ActiveEvent event={event} />
					)}
			</CardContent>
		</Card>
	);
}

async function fetchInProgressEvents(leagueId: string) {
	const events = await fetchEvents(leagueId);
	return events.filter(
		(event) => event.start_time < new Date() && event.end_time > new Date(),
	);
}

export default async function InProgressSection({
	leagueId,
}: {
	leagueId: string;
}) {
	const inProgressEvents = await fetchInProgressEvents(leagueId);

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
