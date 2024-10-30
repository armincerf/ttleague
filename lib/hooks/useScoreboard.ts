import { useActor, useActorRef, useMachine, useSelector } from "@xstate/react";
import { useEffect, useCallback } from "react";
import {
	createScoreboardMachine,
	type ScoreboardContext,
	type ScoreboardCallbacks,
	ScoreboardStateSchema,
} from "../scoreboard/machine";
import { DEFAULT_GAME_STATE } from "@/lib/scoreboard/constants";
import {
	ScoreboardMachineContext,
	STORAGE_KEY,
} from "../contexts/ScoreboardContext";
import { debounce } from "@/lib/utils";
import type { MachineSnapshot, StateValue } from "xstate";
import { sub } from "date-fns";

export interface StateProvider {
	updateScore: (player: 1 | 2, score: number) => Promise<void>;
	updatePlayerOneStarts: (starts: boolean) => Promise<void>;
	updateGame: (gameState: Partial<ScoreboardContext>) => Promise<void>;
	onExternalUpdate?: (
		callback: (state: Partial<ScoreboardContext>) => void,
	) => () => void;
}

const debouncedSave = debounce((snapshot: unknown) => {
	if (typeof snapshot !== "object" || snapshot === null) {
		return;
	}
	try {
		console.log("Saving state", snapshot);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
	} catch (error) {
		console.error("Error persisting state:", error);
	}
}, 100);

export function useScoreboard(stateProvider?: StateProvider) {
	const actorRef = ScoreboardMachineContext.useActorRef();
	const state = useSelector(actorRef, (state) => state);

	const send = actorRef.send;

	useEffect(() => {
		if (stateProvider?.onExternalUpdate) {
			return stateProvider.onExternalUpdate((newState) => {
				send({ type: "EXTERNAL_UPDATE", state: newState });
			});
		}
	}, [stateProvider, send]);

	useEffect(() => {
		const subscription = actorRef.subscribe(debouncedSave);
		return () => subscription.unsubscribe();
	}, [actorRef]);

	return {
		state,
		send,
		actorRef,
		isGameOver: state.matches("gameOverConfirmation"),
		isMatchOver: state.matches("matchOver"),
		incrementScore: (player: 1 | 2) =>
			send({
				type: "INCREMENT_SCORE",
				playerId: player === 1 ? "player1" : "player2",
			}),
		setScore: (player: 1 | 2, score: number) =>
			send({
				type: "SET_SCORE",
				playerId: player === 1 ? "player1" : "player2",
				score,
			}),
		setPlayerOneStarts: (starts: boolean) =>
			send({ type: "SET_PLAYER_ONE_STARTS", starts }),
		toggleCorrectionsMode: () => send({ type: "TOGGLE_CORRECTIONS_MODE" }),
		confirmGameOver: (confirmed: boolean) =>
			send({ type: "CONFIRM_GAME_OVER", confirmed }),
		isCorrectionsMode: state.matches("corrections"),
	};
}
