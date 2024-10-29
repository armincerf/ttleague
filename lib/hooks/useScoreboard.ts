import { useMachine } from "@xstate/react";
import { useEffect } from "react";
import {
	createScoreboardMachine,
	type ScoreboardContext,
	type ScoreboardCallbacks,
} from "../scoreboard/machine";
import { getWinner } from "../scoreboard/utils";
import { DEFAULT_GAME_STATE } from "@/lib/scoreboard/constants";

export interface StateProvider {
	updateScore: (player: 1 | 2, score: number) => Promise<void>;
	updatePlayerOneStarts: (starts: boolean) => Promise<void>;
	updateGame: (gameState: Partial<ScoreboardContext>) => Promise<void>;
	onExternalUpdate?: (
		callback: (state: Partial<ScoreboardContext>) => void,
	) => () => void;
}

export function useScoreboard(
	initialState: Partial<ScoreboardContext>,
	stateProvider?: StateProvider,
) {
	const [state, send] = useMachine(
		createScoreboardMachine({
			initialContext: {
				...DEFAULT_GAME_STATE,
				...initialState,
			},
			onScoreChange: (player, score) => {
				stateProvider?.updateScore(player, score);
			},
			onPlayerOneStartsChange: (starts) => {
				stateProvider?.updatePlayerOneStarts(starts);
			},
			onGameComplete: (winner) => {
				const gameWinner = winner ? 1 : 2;
				stateProvider?.updateGame({
					player1Score: 0,
					player2Score: 0,
					[`player${gameWinner}GamesWon`]:
						state.context[`player${gameWinner}GamesWon`] + 1,
				});
			},
		}),
	);

	useEffect(() => {
		if (stateProvider?.onExternalUpdate) {
			return stateProvider.onExternalUpdate((newState) => {
				send({ type: "EXTERNAL_UPDATE", state: newState });
			});
		}
	}, [stateProvider, send]);

	return {
		state: state.context,
		isGameOver: state.matches("gameOverConfirmation"),
		isMatchOver: state.matches("matchOver"),
		incrementScore: (player: 1 | 2) =>
			send({ type: "INCREMENT_SCORE", player }),
		setScore: (player: 1 | 2, score: number) =>
			send({ type: "SET_SCORE", player, score }),
		setPlayerOneStarts: (starts: boolean) =>
			send({ type: "SET_PLAYER_ONE_STARTS", starts }),
		toggleCorrectionsMode: () => send({ type: "TOGGLE_CORRECTIONS_MODE" }),
		confirmGameOver: (confirmed: boolean) =>
			send({ type: "CONFIRM_GAME_OVER", confirmed }),
	};
}
