import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import { getDivision } from "@/lib/ratingSystem";
import { headers } from "next/headers";

export const fetchUser = unstable_cache(
	async (userId: string) => {
		const headersList = await headers();
		const start = performance.now();
		try {
			const user = await httpClient.fetchById("users", userId);
			if (!user) {
				logger.warn({ userId }, "User not found");
				return null;
			}
			const validatedDivision = getDivision(user.current_division);
			return {
				...user,
				current_division: validatedDivision,
			};
		} catch (error) {
			logger.error({ userId, error }, "Error fetching user");
			throw error;
		} finally {
			const end = performance.now();
			headersList.append("Server-Timing", `fetchUser;dur=${end - start}`);
		}
	},
	["user"],
	{ revalidate: 60 },
);

export const fetchUserForLeague = unstable_cache(
	async (userId: string, leagueId: string) => {
		const headersList = await headers();
		const start = performance.now();
		try {
			const users = await httpClient.fetch(
				httpClient
					.query("users")
					.where([
						["id", "=", userId],
						["registered_league_ids", "has", leagueId],
					])
					.build(),
			);
			return users[0] || null;
		} catch (error) {
			logger.error(
				{ userId, leagueId, error },
				"Error fetching user for league",
			);
			throw error;
		} finally {
			const end = performance.now();
			headersList.append(
				"Server-Timing",
				`fetchUserForLeague;dur=${end - start}`,
			);
		}
	},
	["userForLeague"],
	{ revalidate: 3600 }, // Cache for 1 hour
);
