import { client } from "@/lib/triplit";
import type { StateProvider } from "@/lib/hooks/useScoreboard";
import type { ScoreboardContext } from "./machine";

export function createTriplitProvider(gameId: string): StateProvider {
	return {
		async updateScore(playerId: string, score: number) {
			await client.fetchById("games", gameId);
			await client.update("games", gameId, (game) => {
				if (playerId === "player1") {
					game.player_1_score = score;
				} else {
					game.player_2_score = score;
				}
				game.last_edited_at = new Date();
			});
		},

		async updatePlayerOneStarts(starts: boolean) {
			await client.fetchById("games", gameId);
			await client.update("games", gameId, (game) => {
				game.current_server = starts ? 0 : 1;
				game.last_edited_at = new Date();
			});
		},

		async updateGame(gameState: Partial<ScoreboardContext>) {
			await client.fetchById("games", gameId);
			await client.update("games", gameId, (game) => {
				if ("playerOne.currentScore" in gameState) {
					game.player_1_score = gameState?.playerOne?.currentScore ?? 0;
				}
				if ("playerTwo.currentScore" in gameState) {
					game.player_2_score = gameState?.playerTwo?.currentScore ?? 0;
				}
				game.last_edited_at = new Date();
			});
		},
	};
}
