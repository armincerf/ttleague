import { client as triplitClient } from "@/lib/triplit";
import type { schema } from "@/triplit/schema";
import type { TriplitClient } from "@triplit/client";

export function createMatchConfirmation(client: TriplitClient<typeof schema>) {
	return {
		async confirmInitialMatch(matchId: string, playerId: string) {
			await client.update("matches", matchId, (match) => {
				match.playersConfirmed.add(playerId);
			});
		},

		async confirmInitialMatchUmpire(matchId: string, umpireId: string) {
			await client.update("matches", matchId, (match) => {
				match.status = "ongoing";
				match.startTime = new Date();
				match.umpireConfirmed = true;
				match.updated_by = umpireId;
			});
		},

		async confirmWinner(matchId: string, winnerId: string) {
			await client.update("matches", matchId, (match) => {
				match.winner = winnerId;
				match.playersConfirmed = new Set();
				match.umpireConfirmed = false;
			});
		},

		async confirmMatchUmpire(matchId: string, umpireId: string) {
			await client.update("matches", matchId, (match) => {
				match.umpireConfirmed = true;
				match.updated_by = umpireId;
				match.playersConfirmed = new Set([match.player_1, match.player_2]);
				match.status = "ended";
			});
		},
	};
}
