import type { StateProvider } from "./useScoreboard";
import type { ScoreboardContext } from "../scoreboard/machine";

export function useStateProvider(stateProvider?: StateProvider) {
	return {
		updateGameState: (state: Partial<ScoreboardContext>) => {
			stateProvider?.updateGame({
				player1Score: 0,
				player2Score: 0,
				player1GamesWon: 0,
				player2GamesWon: 0,
				playerOneStarts: state.playerOneStarts ?? true,
				sidesSwapped: state.sidesSwapped ?? false,
				...state,
			});
		},
	};
}
