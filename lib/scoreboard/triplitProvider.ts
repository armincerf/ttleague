import { client } from "@/lib/triplit";
import type { StateProvider } from "@/lib/hooks/useScoreboard";
import type { ScoreboardContext } from "./machine";

export function createTriplitProvider(gameId: string): StateProvider {
	return {
		async updateScore(player: 1 | 2, score: number) {
			await client.update("games", gameId, (game) => {
				if (player === 1) {
					game.player_1_score = score;
				} else {
					game.player_2_score = score;
				}
				game.last_edited_at = new Date();
			});
		},

		async updatePlayerOneStarts(starts: boolean) {
			await client.update("games", gameId, (game) => {
				game.current_server = starts ? 0 : 1;
				game.last_edited_at = new Date();
			});
		},

		async updateGame(gameState: Partial<ScoreboardContext>) {
			await client.update("games", gameId, (game) => {
				if ("player1Score" in gameState) {
					game.player_1_score = gameState.player1Score ?? 0;
				}
				if ("player2Score" in gameState) {
					game.player_2_score = gameState.player2Score ?? 0;
				}
				game.last_edited_at = new Date();
			});
		},
	};
}
