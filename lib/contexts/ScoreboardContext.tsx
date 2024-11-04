import { createActorContext } from "@xstate/react";
import {
	createScoreboardMachine,
	ScoreboardStateSchema,
	type ScoreboardContext,
} from "../scoreboard/machine";
import { calculateCurrentServer } from "../scoreboard/utils";
import type { StateProvider } from "../hooks/useScoreboard";
import { MotionGlobalConfig } from "framer-motion";

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
	persistState?: boolean;
}

export const STORAGE_KEY = "scoreboard-json";

const getPersistedState = () => {
	if (typeof window === "undefined") return null;

	try {
		const savedState = localStorage.getItem(STORAGE_KEY);
		if (!savedState) return null;

		const parsedState = JSON.parse(savedState);
		const validatedState = ScoreboardStateSchema.safeParse(parsedState);

		if (!validatedState.success) {
			console.warn("Invalid persisted state:", validatedState.error);
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}

		MotionGlobalConfig.skipAnimations =
			validatedState.data.context.disableAnimations;
		return validatedState.data;
	} catch (error) {
		console.warn("Error loading persisted state:", error);
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
};

const persistedState = getPersistedState();

export function ScoreboardProvider({
	stateProvider,
	children,
	persistState = false,
}: ScoreboardProviderProps) {
	const machine = createScoreboardMachine({
		onScoreChange: stateProvider?.updateScore,
		onGameComplete: stateProvider?.onGameComplete,
	});
	return (
		<ScoreboardMachineContext.Provider
			logic={machine}
			options={{
				input: {
					initialContext: persistState ? persistedState?.context : {},
				},
			}}
		>
			{children}
		</ScoreboardMachineContext.Provider>
	);
}
