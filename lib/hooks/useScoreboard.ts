import { useActor, useActorRef, useMachine } from "@xstate/react";
import { useEffect } from "react";
import {
  createScoreboardMachine,
  type ScoreboardContext,
  type ScoreboardCallbacks,
  ScoreboardStateSchema,
} from "../scoreboard/machine";
import { DEFAULT_GAME_STATE } from "@/lib/scoreboard/constants";

export interface StateProvider {
  updateScore: (player: 1 | 2, score: number) => Promise<void>;
  updatePlayerOneStarts: (starts: boolean) => Promise<void>;
  updateGame: (gameState: Partial<ScoreboardContext>) => Promise<void>;
  onExternalUpdate?: (
    callback: (state: Partial<ScoreboardContext>) => void
  ) => () => void;
}

const STORAGE_KEY = "scoreboard-state";

export function useScoreboard(
  initialState: Partial<ScoreboardContext>,
  stateProvider?: StateProvider
) {
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

      return validatedState.data;
    } catch (error) {
      console.warn("Error loading persisted state:", error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const [state, send, actorRef] = useMachine(
    createScoreboardMachine({
      onScoreChange: (playerId, score) => {
        stateProvider?.updateScore(playerId === "player1" ? 1 : 2, score);
      },
      onPlayerOneStartsChange: (starts) => {
        stateProvider?.updatePlayerOneStarts(starts);
      },
      onGameComplete: (winnerIsPlayerOne) => {
        const gameWinner = winnerIsPlayerOne ? 1 : 2;
        stateProvider?.updateGame({
          playerOne: { ...state.context.playerOne, currentScore: 0 },
          playerTwo: { ...state.context.playerTwo, currentScore: 0 },
          [`player${gameWinner}`]: {
            ...state.context[`player${gameWinner === 1 ? "One" : "Two"}`],
            gamesWon:
              state.context[`player${gameWinner === 1 ? "One" : "Two"}`]
                .gamesWon + 1,
          },
        });
      },
    }),
    {
      input: {
        initialContext: {
          ...DEFAULT_GAME_STATE,
          ...initialState,
        },
      },
    }
  );

  useEffect(() => {
    if (stateProvider?.onExternalUpdate) {
      return stateProvider.onExternalUpdate((newState) => {
        send({ type: "EXTERNAL_UPDATE", state: newState });
      });
    }
  }, [stateProvider, send]);

  useEffect(() => {
    actorRef.subscribe((snapshot) => {
      try {
        const stateToSave = snapshot;
        const validatedState = ScoreboardStateSchema.parse(stateToSave);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedState));
      } catch (error) {
        console.error("Error persisting state:", error);
      }
    });
  }, [actorRef]);

  return {
    state: state.context,
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
  };
}
