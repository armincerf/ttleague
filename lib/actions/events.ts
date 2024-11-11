import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import type { HttpClient, TriplitClient } from "@triplit/client";
import type { schema } from "@/triplit/schema";

export function eventQuery(
	client: HttpClient<typeof schema>,
	id: string,
	idKey: "league_id" | "id",
) {
	return client
		.query("events")
		.where(idKey, "=", id)
		.include("club")
		.include("matches", (rel) =>
			rel("matches")
				.include("player1")
				.include("player2")
				.include("games")
				.build(),
		)
		.include("registrations", (rel) =>
			rel("registrations").include("user").build(),
		);
}

export async function fetchEvent(eventId: string) {
	try {
		const client = httpClient();
		const event = await client.fetchOne(
			eventQuery(client, eventId, "id").build(),
		);
		if (!event) {
			logger.warn({ eventId }, "Event not found");
			return null;
		}
		return event;
	} catch (error) {
		logger.error({ eventId, error }, "Error fetching event");
		throw error;
	}
}

export async function fetchEvents(leagueId: string) {
	try {
		const client = httpClient();
		const res = await client.fetch(
			eventQuery(client, leagueId, "league_id").build(),
		);
		return res.filter(Boolean);
	} catch (error) {
		logger.error({ leagueId, error }, "Error fetching events");
		throw error;
	}
}

export async function fetchNextEvent(leagueId: string) {
	const events = await fetchEvents(leagueId);
	const nextEvent = events
		.filter((event) => event.start_time)
		.filter((event) => event.start_time > new Date())
		.sort((a, b) => a.start_time.getTime() - b.start_time.getTime())?.[0];
	if (!nextEvent || Array.isArray(nextEvent)) return null;

	const players = nextEvent.registrations
		.map((reg) => reg.user)
		.filter(Boolean);

	return {
		...nextEvent,
		name: nextEvent.name,
		startTime: new Date(nextEvent.start_time),
		endTime: new Date(nextEvent.end_time),
		venue: nextEvent.club?.name ?? "Venue TBC",
		maxCapacity: nextEvent.capacity ?? 0,
		tables: nextEvent.tables.size ?? 0,
		registeredPlayers: players.map((player) => ({
			...player,
			name: `${player.first_name} ${player.last_name}`,
			avatarUrl: player.profile_image_url ?? "",
		})),
	};
}

export async function revalidateEvent(eventId: string) {
	const res = await fetch(`/api/revalidate?tag=event-${eventId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate event");
	}
}

export async function revalidateEvents(leagueId: string) {
	const res = await fetch(`/api/revalidate?tag=events-${leagueId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate events");
	}
}

export type Event = Awaited<ReturnType<typeof fetchEvent>>;
export type Events = Awaited<ReturnType<typeof fetchEvents>>;
