import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export async function fetchMatches(eventId: string) {
	const start = performance.now();
	try {
		const matches = await unstable_cache(
			async () => {
				try {
					return await httpClient.fetch(
						httpClient
							.query("matches")
							.where("event_id", "=", eventId)
							.include("player1")
							.include("player2")
							.build(),
					);
				} catch (error) {
					logger.error({ eventId, error }, "Error fetching matches");
					throw error;
				}
			},
			["matches", eventId],
			{ revalidate: 60 },
		)();
		return matches;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, eventId }, "fetchMatches completed");
	}
}

export async function fetchMatch(matchId: string) {
	const start = performance.now();
	try {
		const match = await unstable_cache(
			async () => {
				try {
					const match = await httpClient.fetchOne(
						httpClient
							.query("matches")
							.where("id", "=", matchId)
							.include("player1")
							.include("player2")
							.include("event")
							.include("games")
							.build(),
					);
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
			["match", matchId],
			{ revalidate: 60 },
		)();
		return match;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, matchId }, "fetchMatch completed");
	}
}

export async function revalidateMatch(matchId: string) {
	const res = await fetch(`/api/revalidate?tag=match-${matchId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate match");
	}
}

export async function revalidateMatches(eventId: string) {
	const res = await fetch(`/api/revalidate?tag=matches-${eventId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate matches");
	}
}
