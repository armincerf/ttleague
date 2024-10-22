import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export async function fetchLeague(leagueId: string) {
	const start = performance.now();
	try {
		const league = await unstable_cache(
			async () => {
				try {
					const league = await httpClient.fetchOne(
						httpClient
							.query("leagues")
							.where("id", "=", leagueId)
							.include("clubs")
							.include("seasons")
							.include("players")
							.build(),
					);
					if (!league) {
						logger.warn({ leagueId }, "League not found");
						return null;
					}
					return league;
				} catch (error) {
					logger.error({ leagueId, error }, "Error fetching league");
					throw error;
				}
			},
			["league", leagueId],
			{ revalidate: 3600 }, // Cache for 1 hour
		)();
		return league;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, leagueId }, "fetchLeague completed");
	}
}

export async function fetchSeasons(leagueId: string) {
	const start = performance.now();
	try {
		const seasons = await unstable_cache(
			async () => {
				try {
					return await httpClient.fetch(
						httpClient
							.query("seasons")
							.where("league_id", "=", leagueId)
							.build(),
					);
				} catch (error) {
					logger.error({ leagueId, error }, "Error fetching seasons");
					throw error;
				}
			},
			["seasons", leagueId],
			{ revalidate: 3600 }, // Cache for 1 hour
		)();
		return seasons;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, leagueId }, "fetchSeasons completed");
	}
}
