import { useMachine } from "@xstate/react";
import { createScoreboardMachine } from "../scoreboard/machine";
import type { ScoreboardState } from "../scoreboard/types";

export function useScoreboardMachine() {
	const [state, send] = useMachine(createScoreboardMachine());

	return {
		state: state.context,
		incrementScore: (player: 1 | 2) =>
			send({ type: "INCREMENT_SCORE", player }),
		setScore: (player: 1 | 2, score: number) =>
			send({ type: "SET_SCORE", player, score }),
		setServer: (player: 0 | 1) => send({ type: "SET_SERVER", player }),
		toggleCorrectionsMode: () => send({ type: "TOGGLE_CORRECTIONS_MODE" }),
		updateFromExternal: (newState: Partial<ScoreboardState>) =>
			send({ type: "EXTERNAL_UPDATE", state: newState }),
	};
}
