import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import { headers } from "next/headers";

export const fetchLeague = unstable_cache(
	async (leagueId: string) => {
		const headersList = await headers();
		const start = performance.now();
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
		} finally {
			const end = performance.now();
			headersList.append("Server-Timing", `fetchLeague;dur=${end - start}`);
		}
	},
	["league"],
	{ revalidate: 3600 }, // Cache for 1 hour
);

export const fetchSeasons = unstable_cache(
	async (leagueId: string) => {
		const headersList = await headers();
		const start = performance.now();
		try {
			const seasons = await httpClient.fetch(
				httpClient.query("seasons").where("league_id", "=", leagueId).build(),
			);
			return seasons;
		} catch (error) {
			logger.error({ leagueId, error }, "Error fetching seasons");
			throw error;
		} finally {
			const end = performance.now();
			headersList.append("Server-Timing", `fetchSeasons;dur=${end - start}`);
		}
	},
	["seasons"],
	{ revalidate: 3600 }, // Cache for 1 hour
);
