import { fetchEvent } from "@/lib/actions/events";
import { EventRegisteredPlayers } from "./EventRegisteredPlayers";
import { AdminButton } from "./AdminButton";
import { AdminEventActions } from "./AdminEventActions";
import EventCard from "./EventCard";

export default async function EventPage({
	params,
}: {
	params: Promise<{ eventId: string; leagueId: string }>;
}) {
	const { eventId } = await params;

	const event = await fetchEvent(eventId);

	return (
		<div className="container mx-auto pt-8 px-4">
			<EventRegisteredPlayers serverEvent={event} />
			<EventCard serverEvent={event} />
			<AdminButton>
				<AdminEventActions event={event} />
			</AdminButton>
		</div>
	);
}
