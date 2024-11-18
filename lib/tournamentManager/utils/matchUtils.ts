import type { TriplitClient } from "@triplit/client";
import type { Match, schema, User } from "@/triplit/schema";
import { findValidPlayerPair } from "./pairingUtils";
import { nanoid } from "nanoid";
export function createMatchGenerator(client: TriplitClient<typeof schema>) {
	return async function generateMatchups(
		tournamentId: string,
		waitingPlayers: User[],
		matchesToday: Match[],
		matchesAllTime: Match[],
		eventId: string,
		totalRounds: number,
		freeTables: number,
	) {
		if (waitingPlayers.length < 3) {
			console.log("Not enough players", waitingPlayers);
			return { success: false, error: "Not enough players" };
		}

		if (freeTables < 1) {
			return { success: false, error: "No free tables available" };
		}

		const validPair = findValidPlayerPair(
			waitingPlayers,
			matchesToday,
			totalRounds,
		);
		if (!validPair?.[0] || !validPair?.[1]) {
			return { success: false, error: "No more valid matches" };
		}

		const usedTables = new Set(
			matchesToday
				.filter((m) => m.status === "ongoing" || m.status === "pending")
				.map((m) => m.table_number),
		);
		const nextTable =
			Array.from({ length: freeTables }, (_, i) => i + 1).find(
				(num) => !usedTables.has(num),
			) ?? 1;

		const [player1, player2] = validPair;

		// Check if players have played before
		const previousMatch = matchesAllTime.some(
			(match) =>
				(match.player_1 === player1.id && match.player_2 === player2.id) ||
				(match.player_1 === player2.id && match.player_2 === player1.id),
		);

		const availableUmpires = waitingPlayers.filter(
			(p) => p.id !== player1.id && p.id !== player2.id,
		);

		if (availableUmpires.length === 0) {
			return { success: false, error: "No available umpire" };
		}

		// Count how many times each player has umpired
		const umpireCount = matchesToday.reduce<Record<string, number>>(
			(acc, match) => {
				if (match.umpire) {
					acc[match.umpire] = (acc[match.umpire] ?? 0) + 1;
				}
				return acc;
			},
			{},
		);

		// Select umpire with lowest count
		const umpire = availableUmpires.reduce((lowest, current) => {
			const lowestCount = umpireCount[lowest.id] ?? 0;
			const currentCount = umpireCount[current.id] ?? 0;
			return currentCount < lowestCount ? current : lowest;
		}, availableUmpires[0]);

		const newMatch = {
			id: `match-${nanoid()}`,
			player_1: player1.id,
			player_2: player2.id,
			umpire: umpire.id,
			status: "pending",
			manually_created: false,
			table_number: nextTable,
			ranking_score_delta: 0,
			event_id: eventId,
			best_of: 5,
		} as const;

		await client.transact(async (tx) => {
			await tx.fetchById("active_tournaments", tournamentId);
			await tx.update("active_tournaments", tournamentId, (tournament) => {
				tournament.status = "started";
			});

			await tx.insert("matches", newMatch);
			await tx.update("users", player1.id, (user) => {
				user.current_tournament_priority = 0;
			});
			await tx.update("users", player2.id, (user) => {
				user.current_tournament_priority = 0;
			});
			await tx.update("users", umpire.id, (user) => {
				user.current_tournament_priority = 3;
			});
		});

		return { success: true, match: newMatch };
	};
}
