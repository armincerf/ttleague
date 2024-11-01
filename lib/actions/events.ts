import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import type { HttpClient, TriplitClient } from "@triplit/client";
import type { schema } from "@/triplit/schema";

export function eventQuery(client: HttpClient<typeof schema>, eventId: string) {
	return client
		.query("events")
		.where("id", "=", eventId)
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
		const event = await httpClient.fetchOne(
			eventQuery(httpClient, eventId).build(),
		);
		if (!event) {
			logger.warn({ eventId }, "Event not found");
			throw new Error(`Event not found: ${eventId}`);
		}
		return event;
	} catch (error) {
		logger.error({ eventId, error }, "Error fetching event");
		throw error;
	}
}

export async function fetchEvents(leagueId: string) {
	try {
		const res = await httpClient.fetch(
			eventQuery(httpClient, leagueId).build(),
		);
		return res.filter(Boolean);
	} catch (error) {
		logger.error({ leagueId, error }, "Error fetching events");
		throw error;
	}
}

export async function fetchNextEvent(leagueId: string) {
	const events = await fetchEvents(leagueId);
	const nextEvent = events.sort(
		(a, b) => a.start_time.getTime() - b.start_time.getTime(),
	)?.[0];
	console.log("nextEvent", nextEvent);
	if (!nextEvent?.name) return null;

	const firstThreePlayerIds = nextEvent?.registrations
		?.slice(0, 3)
		.map((reg) => reg.user_id);
	const players = await httpClient.fetch(
		httpClient.query("users").where("id", "in", firstThreePlayerIds).build(),
	);

	console.log("nextEvent", events);

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
