"use client";
import { useEffect, useState, useMemo } from "react";
import { useMachine } from "@xstate/react";
import type {
	createScoreboardMachine,
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

const impact = localFont({
	src: "./fonts/anton-regular.ttf",
	variable: "--font-score",
	weight: "400",
});

interface Player {
	firstName: string;
	lastName: string;
}

interface ScoreboardProps {
	player1?: Player;
	player2?: Player;
	initialState?: Partial<ScoreboardContext>;
	stateProvider?: StateProvider;
	loading?: boolean;
}

const STORAGE_KEY = "scoreboardSettings";

const storedSettingsSchema = z.object({
	bestOf: z.number().optional(),
	pointsToWin: z.number().optional(),
	playerOneStarts: z.boolean().optional(),
	sidesSwapped: z.boolean().optional(),
	player1Name: z.string().optional(),
	player2Name: z.string().optional(),
});

type StoredSettings = z.infer<typeof storedSettingsSchema>;

function getStoredSettings(): Partial<StoredSettings> {
	if (typeof window === "undefined") return {};
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return {};
	try {
		const parsed = storedSettingsSchema.safeParse(JSON.parse(stored));
		return parsed.success ? parsed.data : {};
	} catch {
		return {};
	}
}

const useScoreboardMachine = (
	machine: ReturnType<typeof createScoreboardMachine>,
) => {
	const [state, send] = useMachine(machine);
	return { state, send };
};

export type TUseScoreboardMachine = ReturnType<typeof useScoreboardMachine>;

function getFullPlayerName(player: Player) {
	return `${player.firstName} ${player.lastName}`.trim();
}

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
			score: state.player1Score,
			isPlayerOne: true,
			color: "bg-primary",
		},
		{
			player: player2,
			score: state.player2Score,
			isPlayerOne: false,
			color: "bg-tt-blue",
		},
	] as const;
}

function createScoreCards(params: {
	loading: boolean;
	player1: Player;
	player2: Player;
	state: TUseScoreboardMachine["state"];
	handleScoreChange: (isPlayerOne: boolean, score: number) => void;
}) {
	const { loading, player1, player2, state, handleScoreChange } = params;
	const winner = getWinner(state.context);

	return getPlayerConfigs({
		player1,
		player2,
		state: state.context,
	}).map(({ player, score, isPlayerOne, color }) => ({
		player,
		score: getPlayerScore(score, loading),
		handleScoreChange: (score: number) => handleScoreChange(isPlayerOne, score),
		indicatorColor: color,
	}));
}

export default function Scoreboard({
	player1: initialPlayer1,
	player2: initialPlayer2,
	initialState = {},
	stateProvider,
	loading = false,
}: ScoreboardProps) {
	const storedSettings = getStoredSettings();
	const [player1, setPlayer1] = useState(() => {
		if (initialPlayer1) return initialPlayer1;
		if (storedSettings.player1Name)
			return splitName(storedSettings.player1Name);
		return { firstName: "Player", lastName: "1" };
	});
	const [player2, setPlayer2] = useState(() => {
		if (initialPlayer2) return initialPlayer2;
		if (storedSettings.player2Name)
			return splitName(storedSettings.player2Name);
		return { firstName: "Player", lastName: "2" };
	});

	const initialContext = useMemo(
		() => ({
			playerOneStarts: storedSettings.playerOneStarts ?? true,
			sidesSwapped: storedSettings.sidesSwapped ?? false,
			player1Name: getFullPlayerName(player1),
			player2Name: getFullPlayerName(player2),
			...initialState,
		}),
		[storedSettings, player1, player2, initialState],
	);

	function handleSettingsUpdate(newSettings: Partial<ScoreboardContext>) {
		const updatedSettings = {
			...DEFAULT_GAME_STATE,
			...newSettings,
			playerOneStarts: newSettings.playerOneStarts ?? true,
		};

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				bestOf: newSettings.bestOf,
				pointsToWin: newSettings.pointsToWin,
				playerOneStarts: newSettings.playerOneStarts,
				sidesSwapped: newSettings.sidesSwapped,
				player1Name: `${player1.firstName} ${player1.lastName}`.trim(),
				player2Name: `${player2.firstName} ${player2.lastName}`.trim(),
			}),
		);
	}

	function handlePlayersSubmit(newPlayer1: Player, newPlayer2: Player) {
		setPlayer1(newPlayer1);
		setPlayer2(newPlayer2);

		// Only save to localStorage if we don't have initial players
		if (!initialPlayer1 && !initialPlayer2) {
			const currentSettings = getStoredSettings();
			const newSettings = {
				...currentSettings,
				player1Name: getFullPlayerName(newPlayer1),
				player2Name: getFullPlayerName(newPlayer2),
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
		}
	}

	return (
		<ScoreboardProvider
			initialContext={initialContext}
			stateProvider={stateProvider}
		>
			<ScoreboardContent
				player1={player1}
				player2={player2}
				loading={loading}
				onSettingsUpdate={handleSettingsUpdate}
				onPlayersSubmit={handlePlayersSubmit}
				initialPlayer1={initialPlayer1}
				initialPlayer2={initialPlayer2}
			/>
		</ScoreboardProvider>
	);
}

function ScoreboardContent({
	player1,
	player2,
	loading,
	onSettingsUpdate,
	onPlayersSubmit,
	initialPlayer1,
	initialPlayer2,
}: {
	player1: Player;
	player2: Player;
	loading: boolean;
	onSettingsUpdate: (settings: Partial<ScoreboardContext>) => void;
	onPlayersSubmit: (player1: Player, player2: Player) => void;
	initialPlayer1?: Player;
	initialPlayer2?: Player;
}) {
	const [isLandscape, setIsLandscape] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	const state = ScoreboardMachineContext.useSelector((state) => state);
	const actorRef = ScoreboardMachineContext.useActorRef();

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
			actorRef.send({ type: "SET_SCORE", player: isPlayerOne ? 1 : 2, score });
		} else {
			actorRef.send({ type: "INCREMENT_SCORE", player: isPlayerOne ? 1 : 2 });
		}
	}

	const isGameOver = state.matches("gameOverConfirmation");
	const isMatchOver = state.matches("matchOver");

	const scoreCards = createScoreCards({
		loading,
		player1,
		player2,
		state,
		handleScoreChange,
	});

	const orderedScoreCards = state.context.sidesSwapped
		? [...scoreCards].reverse()
		: scoreCards;

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
							player1Score={state.context.player1Score}
							player2Score={state.context.player2Score}
							onConfirm={() =>
								actorRef.send({ type: "CONFIRM_GAME_OVER", confirmed: true })
							}
							onCancel={() =>
								actorRef.send({ type: "CONFIRM_GAME_OVER", confirmed: false })
							}
						/>
					</div>
				)}
				{isMatchOver && (
					<div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
						<MatchOverModal
							player1GamesWon={state.context.player1GamesWon}
							player2GamesWon={state.context.player2GamesWon}
							onClose={() => {
								actorRef.send({ type: "RESET_MATCH" });
							}}
						/>
					</div>
				)}
				{isLandscape ? (
					<LandscapeScoreboard
						state={state}
						send={actorRef.send}
						orderedScoreCards={orderedScoreCards}
						winner={!!getWinner(state.context)}
					/>
				) : (
					<PortraitScoreboard
						state={state}
						send={actorRef.send}
						orderedScoreCards={orderedScoreCards}
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
					onUpdate={onSettingsUpdate}
					players={{
						player1,
						player2,
					}}
					onPlayersSubmit={onPlayersSubmit}
				/>
			</div>
		</div>
	);
}
