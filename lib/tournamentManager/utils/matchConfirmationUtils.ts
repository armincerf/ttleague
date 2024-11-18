import { client as triplitClient } from "@/lib/triplit";
import type { schema } from "@/triplit/schema";
import type { TriplitClient } from "@triplit/client";

export function createMatchConfirmation(client: TriplitClient<typeof schema>) {
	return {
		async confirmInitialMatch(matchId: string, playerId: string) {
			await client.fetchById("matches", matchId);
			await client.update("matches", matchId, (match) => {
				match.playersConfirmed.add(playerId);
			});
		},

		async confirmInitialMatchUmpire(
			matchId: string,
			umpireId: string,
			serverId: string,
		) {
			await client.fetchById("matches", matchId);
			await client.transact(async (tx) => {
				await tx.update("matches", matchId, (match) => {
					match.status = "ongoing";
					match.startTime = new Date();
					match.umpireConfirmed = true;
					match.updated_by = umpireId;
					// If server is player 2, swap players so server is always player 1
					if (serverId === match.player_2) {
						const temp = match.player_1;
						match.player_1 = match.player_2;
						match.player_2 = temp;
					}
				});

				await tx.insert("games", {
					match_id: matchId,
					player_1_score: 0,
					player_2_score: 0,
					game_number: 1,
					started_at: new Date(),
					updated_by: umpireId,
				});
			});
		},
		async confirmWinner(matchId: string, winnerId: string) {
			await client.fetchById("matches", matchId);
			await client.update("matches", matchId, (match) => {
				match.winner = winnerId;
				match.playersConfirmed = new Set();
				match.umpireConfirmed = false;
			});
		},

		async confirmMatchUmpire(matchId: string, umpireId: string) {
			await client.fetchById("matches", matchId);
			await client.update("matches", matchId, async (match) => {
				match.umpireConfirmed = true;
				match.updated_by = umpireId;
				match.playersConfirmed = new Set([match.player_1, match.player_2]);
				match.status = "ended";
				try {
					await client.fetchById(
						"active_tournaments",
						`tournament-${match.event_id}`,
					);
					await client.update(
						"active_tournaments",
						`tournament-${match.event_id}`,
						(tournament) => {
							tournament.player_ids.delete(match.player_1);
							tournament.player_ids.delete(match.player_2);
							if (match.umpire) {
								tournament.player_ids.delete(match.umpire);
							}
						},
					);
				} catch (error) {
					console.error("Error updating active tournament", error);
				}
			});
		},
	};
}
