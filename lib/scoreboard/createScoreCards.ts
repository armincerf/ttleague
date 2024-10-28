import type { ScoreboardContext } from "./machine";
import type { Player } from "./types";
import { formatPlayerName } from "./utils";

export function createScoreCards(
	state: ScoreboardContext,
	player1: Player,
	player2: Player,
	loading: boolean,
	send: (event: { type: string; [key: string]: unknown }) => void,
) {
	return [
		{
			player: loading ? "-" : formatPlayerName(player1),
			score: loading ? 0 : state.player1Score,
			handleScoreChange: (score: number) =>
				send({
					type: state.correctionsMode ? "SET_SCORE" : "INCREMENT_SCORE",
					player: 1,
					score,
				}),
			isPlayerOneStarting: !state.sidesSwapped === state.playerOneStarts,
			setPlayerOneStarting: () =>
				send({ type: "SET_PLAYER_ONE_STARTS", starts: true }),
			indicatorColor: "bg-primary",
		},
		{
			player: loading ? "-" : formatPlayerName(player2),
			score: loading ? 0 : state.player2Score,
			handleScoreChange: (score: number) =>
				send({
					type: state.correctionsMode ? "SET_SCORE" : "INCREMENT_SCORE",
					player: 2,
					score,
				}),
			isPlayerOneStarting: state.sidesSwapped === state.playerOneStarts,
			setPlayerOneStarting: () =>
				send({ type: "SET_PLAYER_ONE_STARTS", starts: false }),
			indicatorColor: "bg-tt-blue",
		},
	];
}
