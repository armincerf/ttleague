import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export function buildMatchesQuery(eventId: string | "recent") {
	const client = httpClient();
	const query = client
		.query("matches")
		.include("player1")
		.include("player2")
		.include("event")
		.include("games");

	if (eventId === "recent") {
		query
			.where("status", "in", ["in_progress", "completed"])
			.order("updated_at", "DESC")
			.limit(20);
	} else {
		query.where("event_id", "=", eventId);
	}

	return query;
}

function buildMatchQuery(matchId: string) {
	const client = httpClient();
	return client
		.query("matches")
		.where("id", "=", matchId)
		.include("player1")
		.include("player2")
		.include("event", (rel) => rel("event").include("club").build())
		.include("games");
}

export async function fetchMatches(eventId: string | "recent") {
	const start = performance.now();
	try {
		const matches = await unstable_cache(
			async () => {
				try {
					const client = httpClient();
					return await client.fetch(buildMatchesQuery(eventId).build());
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
					const client = httpClient();
					const match = await client.fetchOne(buildMatchQuery(matchId).build());
					if (!match) {
						logger.warn({ matchId }, "Match not found");
						return null;
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

export type Match = NonNullable<Awaited<ReturnType<typeof fetchMatch>>>;
export type Matches = Awaited<ReturnType<typeof fetchMatches>>;
