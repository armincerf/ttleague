import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import { headers } from "next/headers";

export const fetchEvent = unstable_cache(
	async (eventId: string) => {
		const headersList = await headers();
		const start = performance.now();
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
		} finally {
			const end = performance.now();
			headersList.append("Server-Timing", `fetchEvent;dur=${end - start}`);
		}
	},
	["event"],
	{ revalidate: 60 },
);

export const fetchEvents = unstable_cache(
	async (leagueId: string) => {
		const headersList = await headers();
		const start = performance.now();
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
		} finally {
			const end = performance.now();
			headersList.append("Server-Timing", `fetchEvents;dur=${end - start}`);
		}
	},
	["events"],
	{ revalidate: 3600 }, // Cache for 1 hour
);
