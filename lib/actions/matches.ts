import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export const fetchMatches = unstable_cache(
	async (eventId: string) => {
		try {
			const matches = await httpClient.fetch(
				httpClient
					.query("matches")
					.where("event_id", "=", eventId)
					.include("player1")
					.include("player2")
					.build(),
			);
			return matches;
		} catch (error) {
			logger.error({ eventId, error }, "Error fetching matches");
			throw error;
		}
	},
	["matches"],
	{ revalidate: 60 },
);

export const fetchMatch = unstable_cache(
	async (matchId: string) => {
		try {
			const match = await httpClient.fetchById("matches", matchId);
			if (!match) {
				logger.warn({ matchId }, "Match not found");
				throw new Error(`Match not found: ${matchId}`);
			}
			return match;
		} catch (error) {
			logger.error({ matchId, error }, "Error fetching match");
			throw error;
		}
	},
	["match"],
	{ revalidate: 60 },
);
