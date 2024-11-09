import { fetchEvent } from "@/lib/actions/events";
import { EventRegisteredPlayers } from "./EventRegisteredPlayers";
import { AdminButton } from "../../../../components/AdminButton";
import { AdminEventActions } from "./AdminEventActions";
import EventCard from "./EventCard";

function EventNotFound() {
	return <div>Event not found</div>;
}

export default async function EventPage({
	params,
}: {
	params: Promise<{ eventId: string; leagueId: string }>;
}) {
	const { eventId } = await params;

	const event = await fetchEvent(eventId);
	if (!event) {
		console.error("Event not found", eventId);
		return <EventNotFound />;
	}

	return (
		<div className="container mx-auto pt-8 px-4">
			{event.status !== "completed" && event.status !== "cancelled" && (
				<EventRegisteredPlayers serverEvent={event} />
			)}
			<EventCard serverEvent={event} />
			<AdminButton>
				<AdminEventActions event={event} />
			</AdminButton>
		</div>
	);
}
