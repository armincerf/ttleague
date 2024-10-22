import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export async function fetchEvent(eventId: string) {
	try {
		const event = await unstable_cache(
			async () => {
				try {
					const event = await httpClient.fetchOne(
						httpClient
							.query("events")
							.where("id", "=", eventId)
							.include("club")
							.include("registrations")
							.build(),
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
			{ revalidate: 60 },
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
			{ revalidate: 3600 }, // Cache for 1 hour
		)();
		return events;
	} catch (error) {
		logger.error({ leagueId, error }, "Error fetching events");
		throw error;
	}
}
