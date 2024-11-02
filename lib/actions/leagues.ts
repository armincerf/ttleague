import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export async function fetchLeague(leagueId: string) {
	const start = performance.now();
	try {
		const league = await httpClient.fetchOne(
			httpClient
				.query("leagues")
				.where("id", "=", leagueId)
				.include("clubs")
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
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, leagueId }, "fetchLeague completed");
	}
}

export async function fetchLeagues() {
	const start = performance.now();
	try {
		return await httpClient.fetch(httpClient.query("leagues").build());
	} catch (error) {
		logger.error({ error }, "Error fetching leagues");
		throw error;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start }, "fetchLeagues completed");
	}
}

export async function fetchSeasons(leagueId: string) {
	const start = performance.now();
	try {
		return await httpClient.fetch(
			httpClient.query("seasons").where("league_id", "=", leagueId).build(),
		);
	} catch (error) {
		logger.error({ leagueId, error }, "Error fetching seasons");
		throw error;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, leagueId }, "fetchSeasons completed");
	}
}

export async function revalidateLeague(leagueId: string) {
	const res = await fetch(`/api/revalidate?tag=league-${leagueId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate league");
	}
}

export async function revalidateLeagues() {
	const res = await fetch("/api/revalidate?tag=leagues", { method: "POST" });
	if (!res.ok) {
		throw new Error("Failed to revalidate leagues");
	}
}
