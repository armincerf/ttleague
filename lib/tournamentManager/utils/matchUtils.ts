import type { TriplitClient } from "@triplit/client";
import type { Match, schema, User } from "@/triplit/schema";
import { performMatchmaking } from "./matchmakingUtils";
import { nanoid } from "nanoid";

export function createMatchGenerator(client: TriplitClient<typeof schema>) {
	return async function generateMatchups(
		tournamentId: string,
		waitingPlayers: User[],
		matchesToday: Match[],
		matchesAllTime: Match[],
		eventId: string,
		totalRounds: number,
		freeTables: Set<number>,
	) {
		if (waitingPlayers.length < 3) {
			console.log("Not enough players", waitingPlayers);
			return { success: false, error: "Not enough players" };
		}

		if (freeTables.size < 1) {
			return { success: false, error: "No free tables available" };
		}

		// Gather last played and umpired dates
		const playerInfoMap = new Map<
			string,
			{ lastPlayedAt?: Date; lastUmpiredAt?: Date }
		>();

		for (const match of matchesAllTime) {
			const { player_1, player_2, umpire, updated_at } = match;

			if (
				!playerInfoMap.has(player_1) ||
				(playerInfoMap.get(player_1)?.lastPlayedAt?.getTime() ?? 0) <
					updated_at.getTime()
			) {
				playerInfoMap.set(player_1, {
					...playerInfoMap.get(player_1),
					lastPlayedAt: updated_at,
				});
			}

			if (
				!playerInfoMap.has(player_2) ||
				(playerInfoMap.get(player_2)?.lastPlayedAt?.getTime() ?? 0) <
					updated_at.getTime()
			) {
				playerInfoMap.set(player_2, {
					...playerInfoMap.get(player_2),
					lastPlayedAt: updated_at,
				});
			}

			if (
				umpire &&
				(!playerInfoMap.has(umpire) ||
					(playerInfoMap.get(umpire)?.lastUmpiredAt?.getTime() ?? 0) <
						updated_at.getTime())
			) {
				playerInfoMap.set(umpire, {
					...playerInfoMap.get(umpire),
					lastUmpiredAt: updated_at,
				});
			}
		}

		// Map waiting players to PlayerInfo
		const playerInfos = waitingPlayers.map((user) => ({
			userId: user.id,
			lastPlayedAt: playerInfoMap.get(user.id)?.lastPlayedAt,
			lastUmpiredAt: playerInfoMap.get(user.id)?.lastUmpiredAt,
			usersPlayedToday: Array.from(
				new Set(
					matchesToday
						.filter((m) => m.player_1 === user.id || m.player_2 === user.id)
						.map((m) => (m.player_1 === user.id ? m.player_2 : m.player_1)),
				),
			),
			timesUmpiredToday: matchesToday.filter((m) => m.umpire === user.id)
				.length,
		}));

		const matches = performMatchmaking(playerInfos);

		if (matches.length === 0) {
			return { success: false, error: "No more valid matches" };
		}

		const usedTables = new Set(
			matchesToday
				.filter((m) => m.status === "ongoing" || m.status === "pending")
				.map((m) => m.table_number),
		);

		const newMatches: Match[] = [];

		const availableTables = freeTables.difference(usedTables);

		for (let i = 0; i < matches.length && i < availableTables.size; i++) {
			const match = matches[i];
			const nextTable = availableTables.values().next().value;

			const newMatch = {
				id: `match-${nanoid()}`,
				player_1: match.playerOneId,
				player_2: match.playerTwoId,
				umpire: match.umpireId,
				status: "pending",
				manually_created: false,
				table_number: nextTable,
				ranking_score_delta: 0,
				event_id: eventId,
				best_of: 5,
				created_at: new Date(),
				updated_at: new Date(),
				edited_at: new Date(),
				updated_by: "createMatchGenerator",
				playersConfirmed: new Set(),
				umpireConfirmed: false,
				startTime: new Date(),
			} as const satisfies Match;

			newMatches.push(newMatch);
		}

		await client.transact(async (tx) => {
			await tx.fetchById("active_tournaments", tournamentId);
			await tx.update("active_tournaments", tournamentId, (tournament) => {
				tournament.status = "started";
			});

			for (const newMatch of newMatches) {
				await tx.insert("matches", newMatch);
				await tx.update("users", newMatch.player_1, (user) => {
					user.current_tournament_priority = 0;
				});
				await tx.update("users", newMatch.player_2, (user) => {
					user.current_tournament_priority = 0;
				});
				if (newMatch.umpire) {
					await tx.update("users", newMatch.umpire, (user) => {
						user.current_tournament_priority = 3;
					});
				}
			}
		});

		return { success: true, matches: newMatches };
	};
}
