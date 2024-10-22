import { unstable_cache } from "next/cache";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import { getDivision } from "@/lib/ratingSystem";

export const fetchUser = unstable_cache(
	async (userId: string) => {
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
		}
	},
	["user"],
	{ revalidate: 60 },
);

export const fetchUserForLeague = unstable_cache(
	async (userId: string, leagueId: string) => {
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
			return users[0];
		} catch (error) {
			logger.error(
				{ userId, leagueId, error },
				"Error fetching user for league",
			);
			throw error;
		}
	},
	["userForLeague"],
	{ revalidate: 60 },
);
