import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";

export async function fetchUser(userId: string) {
	const start = performance.now();
	try {
		const client = httpClient();
		const user = await client.fetchById("users", userId);
		console.log("user", user);
		if (!user) {
			logger.warn({ userId }, "User not found");
			return null;
		}
		return user;
	} catch (error) {
		logger.error({ userId, error }, "Error fetching user");
		throw error;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start, userId }, "fetchUser completed");
	}
}

export async function fetchUsers() {
	const start = performance.now();
	try {
		const client = httpClient();
		const users = await client.fetch(client.query("users").build());
		return users;
	} catch (error) {
		logger.error({ error }, "Error fetching users");
		throw error;
	} finally {
		const end = performance.now();
		logger.info({ duration: end - start }, "fetchUsers completed");
	}
}

export async function fetchUserForLeague(userId: string, leagueId: string) {
	const start = performance.now();
	try {
		const client = httpClient();
		const users = await client.fetch(
			client
				.query("users")
				.where([
					["id", "=", userId],
					["registered_league_ids", "has", leagueId],
				])
				.build(),
		);
		return users[0];
	} catch (error) {
		logger.error({ userId, leagueId, error }, "Error fetching user for league");
		throw error;
	} finally {
		const end = performance.now();
		logger.info(
			{ duration: end - start, userId, leagueId },
			"fetchUserForLeague completed",
		);
	}
}

export async function revalidateUser(userId: string) {
	const res = await fetch(`/api/revalidate?tag=user-${userId}`, {
		method: "POST",
	});
	if (!res.ok) {
		throw new Error("Failed to revalidate user");
	}
}

export async function revalidateUsers() {
	const res = await fetch("/api/revalidate?tag=users", { method: "POST" });
	if (!res.ok) {
		throw new Error("Failed to revalidate users");
	}
}
