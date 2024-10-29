"use client";
import { useEffect, useState, useMemo } from "react";
import { useMachine } from "@xstate/react";
import type {
	createScoreboardMachine,
	Player,
	ScoreboardContext,
} from "@/lib/scoreboard/machine";
import { GameConfirmationModal } from "./GameConfirmationModal";
import { MatchOverModal } from "./MatchOverModal";
import { getWinner } from "@/lib/scoreboard/utils";
import { SettingsModal } from "./SettingsModal";
import { SettingsIcon } from "lucide-react";
import { z } from "zod";
import { splitName, formatPlayerName } from "@/lib/scoreboard/utils";
import TopBar from "../TopBar";
import { cn } from "@/lib/utils";
import { LandscapeScoreboard } from "./LandscapeScoreboard";
import { PortraitScoreboard } from "./PortraitScoreboard";
import { DEFAULT_GAME_STATE } from "@/lib/scoreboard/constants";
import type { StateProvider } from "@/lib/hooks/useScoreboard";
import localFont from "next/font/local";
import { ScoreboardMachineContext } from "@/lib/contexts/ScoreboardContext";
import { ScoreboardProvider } from "@/lib/contexts/ScoreboardContext";
import { STORAGE_KEY } from "@/lib/scoreboard/storage";
import { getStoredSettings, saveSettings } from "@/lib/scoreboard/storage";

const impact = localFont({
	src: "./fonts/anton-regular.ttf",
	variable: "--font-score",
	weight: "400",
});

interface ScoreboardProps {
	player1?: Player;
	player2?: Player;
	initialState?: Partial<ScoreboardContext>;
	stateProvider?: StateProvider;
	loading?: boolean;
}

const useScoreboardMachine = (
	machine: ReturnType<typeof createScoreboardMachine>,
) => {
	const [state, send] = useMachine(machine, {
		input: {
			initialContext: {
				...DEFAULT_GAME_STATE,
			},
		},
	});
	return { state, send };
};

export type TUseScoreboardMachine = ReturnType<typeof useScoreboardMachine>;

function getPlayerDisplay(player: Player, loading: boolean) {
	return loading ? "-" : formatPlayerName(player);
}

function getPlayerScore(score: number, loading: boolean) {
	return loading ? 0 : score;
}

function getPlayerConfigs(params: {
	player1: Player;
	player2: Player;
	state: ScoreboardContext;
}) {
	const { player1, player2, state } = params;

	return [
		{
			player: player1,
			score: state.playerOne.currentScore,
			isPlayerOne: true,
			color: "bg-primary",
		},
		{
			player: player2,
			score: state.playerTwo.currentScore,
			isPlayerOne: false,
			color: "bg-tt-blue",
		},
	] as const;
}

export default function Scoreboard({
	player1: initialPlayer1,
	player2: initialPlayer2,
	initialState = {},
	stateProvider,
	loading = false,
}: ScoreboardProps) {
	const storedSettings = getStoredSettings();

	const initialContext = useMemo(() => {
		const player1Data =
			initialPlayer1 ?? splitName(storedSettings.player1Name ?? "");
		const player2Data =
			initialPlayer2 ?? splitName(storedSettings.player2Name ?? "");

		return {
			...DEFAULT_GAME_STATE,
			playerOne: {
				...DEFAULT_GAME_STATE.playerOne,
				firstName: player1Data.firstName,
				lastName: player1Data.lastName,
			},
			playerTwo: {
				...DEFAULT_GAME_STATE.playerTwo,
				firstName: player2Data.firstName,
				lastName: player2Data.lastName,
			},
			playerOneStarts: storedSettings.playerOneStarts ?? true,
			sidesSwapped: storedSettings.sidesSwapped ?? false,
			bestOf: storedSettings.bestOf ?? DEFAULT_GAME_STATE.bestOf,
			pointsToWin: storedSettings.pointsToWin ?? DEFAULT_GAME_STATE.pointsToWin,
			...initialState,
		};
	}, [storedSettings, initialPlayer1, initialPlayer2, initialState]);

	function handlePlayersSubmit(newPlayer1: Player, newPlayer2: Player) {
		console.log("handlePlayersSubmit", newPlayer1, newPlayer2);
	}

	return (
		<ScoreboardProvider
			initialContext={initialContext}
			stateProvider={stateProvider}
		>
			<ScoreboardContent
				loading={loading}
				onPlayersSubmit={handlePlayersSubmit}
				initialPlayer1={initialPlayer1}
				initialPlayer2={initialPlayer2}
			/>
		</ScoreboardProvider>
	);
}

function ScoreboardContent({
	loading,
	onPlayersSubmit,
	initialPlayer1,
	initialPlayer2,
}: {
	loading: boolean;
	onPlayersSubmit: (player1: Player, player2: Player) => void;
	initialPlayer1?: Player;
	initialPlayer2?: Player;
}) {
	const [isLandscape, setIsLandscape] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	const state = ScoreboardMachineContext.useSelector((state) => state);
	const send = ScoreboardMachineContext.useActorRef().send;

	useEffect(() => {
		function handleOrientationChange() {
			setIsLandscape(
				window.matchMedia("(max-width: 1024px) and (orientation: landscape)")
					.matches,
			);
		}

		handleOrientationChange();
		window.addEventListener("resize", handleOrientationChange);
		setTimeout(() => {
			document.documentElement.style.zoom = "100%";
		}, 500);
		return () => window.removeEventListener("resize", handleOrientationChange);
	}, []);

	function handleScoreChange(isPlayerOne: boolean, score: number) {
		if (state.context.correctionsMode) {
			send({
				type: "SET_SCORE",
				playerId: isPlayerOne ? "player1" : "player2",
				score,
			});
		} else {
			send({
				type: "INCREMENT_SCORE",
				playerId: isPlayerOne ? "player1" : "player2",
			});
		}
	}

	const isGameOver = state.matches("gameOverConfirmation");
	const isMatchOver = state.matches("matchOver");

	return (
		<div className={`relative p-0 m-0 ${impact.variable} w-full h-full`}>
			{!isLandscape && <TopBar />}
			<button
				type="button"
				onClick={() => setShowSettings(true)}
				className={cn(
					"absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-[100]",
				)}
			>
				<SettingsIcon className="w-6 h-6" />
			</button>
			<div className="font-sans">
				{isGameOver && (
					<div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
						<GameConfirmationModal
							player1={state.context.playerOne}
							player2={state.context.playerTwo}
							onConfirm={() =>
								send({ type: "CONFIRM_GAME_OVER", confirmed: true })
							}
							onCancel={() =>
								send({ type: "CONFIRM_GAME_OVER", confirmed: false })
							}
						/>
					</div>
				)}
				{isMatchOver && (
					<div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
						<MatchOverModal
							player1={state.context.playerOne}
							player2={state.context.playerTwo}
							onClose={() => {
								send({ type: "RESET_MATCH" });
							}}
						/>
					</div>
				)}
				{isLandscape ? (
					<LandscapeScoreboard
						state={state}
						send={send}
						player1={state.context.playerOne}
						player2={state.context.playerTwo}
						winner={!!getWinner(state.context)}
					/>
				) : (
					<PortraitScoreboard
						state={state}
						send={send}
						player1={state.context.playerOne}
						player2={state.context.playerTwo}
						winner={!!getWinner(state.context)}
					/>
				)}

				<SettingsModal
					isOpen={showSettings}
					onClose={() => setShowSettings(false)}
					settings={{
						bestOf: state.context.bestOf,
						pointsToWin: state.context.pointsToWin,
						playerOneStarts: state.context.playerOneStarts,
						sidesSwapped: state.context.sidesSwapped,
					}}
					players={{
						player1: state.context.playerOne,
						player2: state.context.playerTwo,
					}}
					onPlayersSubmit={onPlayersSubmit}
				/>
				{process.env.NODE_ENV === "development" && (
					<div className="absolute top-0 left-0  bg-red-500 z-[100]">
						{JSON.stringify(state.context, null, 2)}
					</div>
				)}
			</div>
		</div>
	);
}
