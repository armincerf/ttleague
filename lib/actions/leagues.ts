import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export const fetchLeague = unstable_cache(
	async (leagueId: string) => {
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
				throw new Error(`League not found: ${leagueId}`);
			}
			return league;
		} catch (error) {
			logger.error({ leagueId, error }, "Error fetching league");
			throw error;
		}
	},
	["league"],
	{ revalidate: 60 },
);

export const fetchSeasons = unstable_cache(
	async (leagueId: string) => {
		try {
			const seasons = await httpClient.fetch(
				httpClient.query("seasons").where("league_id", "=", leagueId).build(),
			);
			return seasons;
		} catch (error) {
			logger.error({ leagueId, error }, "Error fetching seasons");
			throw error;
		}
	},
	["seasons"],
	{ revalidate: 60 },
);
