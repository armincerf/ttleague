import type { TriplitClient } from "@triplit/client";
import type { Match, schema, User } from "@/triplit/schema";
import { findValidPlayerPair } from "./pairingUtils";

export function createMatchGenerator(client: TriplitClient<typeof schema>) {
	return async function generateMatchups(
		tournamentId: string,
		waitingPlayers: User[],
		matches: Match[],
		eventId: string,
		totalRounds: number,
	) {
		if (waitingPlayers.length < 3) {
			return { success: false, error: "Not enough players" };
		}

		const validPair = findValidPlayerPair(waitingPlayers, matches, totalRounds);
		if (!validPair?.[0] || !validPair?.[1]) {
			return { success: false, error: "No valid matches" };
		}

		const [player1, player2] = validPair;
		const umpire = waitingPlayers.find(
			(p) => p.id !== player1.id && p.id !== player2.id,
		);

		if (!umpire) {
			return { success: false, error: "No available umpire" };
		}

		await client.transact(async (tx) => {
			await tx.update("active_tournaments", tournamentId, (tournament) => {
				tournament.status = "started";
			});

			await tx.insert("matches", {
				player_1: player1.id,
				player_2: player2.id,
				umpire: umpire.id,
				status: "pending",
				manually_created: false,
				table_number: 1,
				ranking_score_delta: 0,
				event_id: eventId,
			});
		});

		return { success: true };
	};
}
