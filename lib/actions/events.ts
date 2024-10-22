import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export const fetchEvent = unstable_cache(
	async (eventId: string) => {
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
	["event"],
	{ revalidate: 60 },
);

export const fetchEvents = unstable_cache(
	async (leagueId: string) => {
		try {
			const events = await httpClient.fetch(
				httpClient
					.query("events")
					.where("league_id", "=", leagueId)
					.include("club")
					.include("registrations")
					.build(),
			);
			return events;
		} catch (error) {
			logger.error({ leagueId, error }, "Error fetching events");
			throw error;
		}
	},
	["events"],
	{ revalidate: 60 },
);
