import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import type { HttpClient, TriplitClient } from "@triplit/client";
import type { schema } from "@/triplit/schema";

export function eventQuery(client: HttpClient<typeof schema>, eventId: string) {
	return client
		.query("events")
		.where("id", "=", eventId)
		.include("club")
		.include("registrations", (rel) =>
			rel("registrations").include("user").build(),
		);
}

export async function fetchEvent(eventId: string) {
	try {
		const event = await unstable_cache(
			async () => {
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
			},
			["event", eventId],
			{ tags: [`event-${eventId}`], revalidate: 60 },
		)();
		return event;
	} catch (error) {
		logger.error({ eventId, error }, "Error fetching event");
		throw error;
	}
}

export async function fetchEvents(leagueId: string) {
	try {
		const events = await unstable_cache(
			async () => {
				try {
					return await httpClient.fetch(
						httpClient
							.query("events")
							.where("league_id", "=", leagueId)
							.include("club")
							.include("registrations")
							.build(),
					);
				} catch (error) {
					logger.error({ leagueId, error }, "Error fetching events");
					throw error;
				}
			},
			["events", leagueId],
			{ tags: [`events-${leagueId}`], revalidate: 60 },
		)();
		return events;
	} catch (error) {
		logger.error({ leagueId, error }, "Error fetching events");
		throw error;
	}
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
