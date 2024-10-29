import { createActorContext } from "@xstate/react";
import {
	createScoreboardMachine,
	type ScoreboardContext,
} from "../scoreboard/machine";
import { calculateCurrentServer } from "../scoreboard/utils";
import type { StateProvider } from "../hooks/useScoreboard";
import { useMemo } from "react";

// Create base machine - we'll provide implementations in the Provider
const baseScoreboardMachine = createScoreboardMachine();

export const ScoreboardMachineContext = createActorContext(
	baseScoreboardMachine,
);

// Selectors
export const selectCurrentServer = (state: { context: ScoreboardContext }) =>
	calculateCurrentServer(state.context);

// Custom hook for current server
export function useCurrentServer() {
	return ScoreboardMachineContext.useSelector(selectCurrentServer);
}

// Provider component that handles machine creation with proper implementations
interface ScoreboardProviderProps {
	initialContext?: Partial<ScoreboardContext>;
	stateProvider?: StateProvider;
	children: React.ReactNode;
}

export function ScoreboardProvider({
	initialContext = {},
	stateProvider,
	children,
}: ScoreboardProviderProps) {
	const machine = useMemo(
		() =>
			createScoreboardMachine({
				initialContext: {
					playerOneStarts: true,
					sidesSwapped: false,
					...initialContext,
				},
				onScoreChange: (player, score) => {
					stateProvider?.updateScore(player, score);
				},
				onGameComplete: (winner) => {
					console.log("game complete", winner);
				},
			}),
		[initialContext, stateProvider],
	);

	return (
		<ScoreboardMachineContext.Provider logic={machine}>
			{children}
		</ScoreboardMachineContext.Provider>
	);
}
