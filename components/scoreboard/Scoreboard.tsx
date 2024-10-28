"use client";
import { useEffect, useState, useMemo } from "react";
import { ScoreCard } from "./ScoreCard";
import { useScoreboard, type StateProvider } from "@/lib/hooks/useScoreboard";
import type { ScoreboardContext } from "@/lib/scoreboard/machine";
import { useMachine } from "@xstate/react";
import { createScoreboardMachine } from "@/lib/scoreboard/machine";
import { GameConfirmationModal } from "./GameConfirmationModal";
import { MatchOverModal } from "./MatchOverModal";
import { getWinner } from "@/lib/scoreboard/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsModal } from "./SettingsModal";
import { SettingsIcon } from "lucide-react";
import { z } from "zod";
import { splitName, formatPlayerName } from "@/lib/scoreboard/utils";
import TopBar from "../TopBar";
import { cn } from "@/lib/utils";
import { LandscapeScoreboard } from "./LandscapeScoreboard";
import { PortraitScoreboard } from "./PortraitScoreboard";

interface Player {
	firstName: string;
	lastName: string;
}

interface ScoreboardProps {
	player1?: Player;
	player2?: Player;
	initialState?: Partial<ScoreboardContext>;
	stateProvider?: StateProvider;
	loading?: boolean; // Add loading prop
}

const STORAGE_KEY = "scoreboardSettings";

const storedSettingsSchema = z.object({
	bestOf: z.number().optional(),
	pointsToWin: z.number().optional(),
	currentServer: z.union([z.literal(0), z.literal(1)]).optional(),
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

function SetCounter({ count }: { count: number }) {
	return (
		<div className="bg-white text-red-500 text-[10rem] py-4 leading-none w-full flex items-start justify-center">
			{count}
		</div>
	);
}

const useScoreboardMachine = (
	machine: ReturnType<typeof createScoreboardMachine>,
) => {
	const [state, send] = useMachine(machine);
	return { state, send };
};

export type TUseScoreboardMachine = ReturnType<typeof useScoreboardMachine>;

export default function Scoreboard({
	player1: initialPlayer1,
	player2: initialPlayer2,
	initialState = {},
	stateProvider,
	loading = false, // Add default value
}: ScoreboardProps) {
	const storedSettings = getStoredSettings();
	const [player1, setPlayer1] = useState(() => {
		if (initialPlayer1) return initialPlayer1;
		if (storedSettings.player1Name)
			return splitName(storedSettings.player1Name);
		return { firstName: "", lastName: "" };
	});
	const [player2, setPlayer2] = useState(() => {
		if (initialPlayer2) return initialPlayer2;
		if (storedSettings.player2Name)
			return splitName(storedSettings.player2Name);
		return { firstName: "", lastName: "" };
	});

	const machine = useMemo(
		() =>
			createScoreboardMachine({
				onScoreChange: (player, score) => {
					console.log("score change", player, score);
				},
				onServerChange: (server) => {
					console.log("server change", server);
				},
				onGameComplete: (winner) => {
					console.log("game complete", winner);
				},
			}),
		[],
	);

	const { state, send } = useScoreboardMachine(machine);

	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		function handleOrientationChange() {
			setIsLandscape(
				window.matchMedia("(max-width: 1024px) and (orientation: landscape)")
					.matches,
			);
		}

		handleOrientationChange();
		window.addEventListener("resize", handleOrientationChange);
		return () => window.removeEventListener("resize", handleOrientationChange);
	}, []);

	function handleScoreChange(player: 1 | 2, score: number) {
		if (state.context.correctionsMode) {
			send({ type: "SET_SCORE", player, score });
		} else {
			send({ type: "INCREMENT_SCORE", player });
		}
	}

	const isGameOver = state.matches("gameOverConfirmation");
	const isMatchOver = state.matches("matchOver");

	const winner = getWinner(state.context);

	const scoreCards = [
		{
			player: loading ? "-" : formatPlayerName(player1),
			score: loading ? 0 : state.context.player1Score,
			handleScoreChange: (score: number) => handleScoreChange(1, score),
			serveTurn: state.context.currentServer === 0,
			setServeTurn: () => send({ type: "SET_SERVER", player: 0 }),
			indicatorColor: "bg-primary",
		},
		{
			player: loading ? "-" : formatPlayerName(player2),
			score: loading ? 0 : state.context.player2Score,
			handleScoreChange: (score: number) => handleScoreChange(2, score),
			serveTurn: state.context.currentServer === 1,
			setServeTurn: () => send({ type: "SET_SERVER", player: 1 }),
			indicatorColor: "bg-tt-blue",
		},
	];

	const orderedScoreCards = state.context.sidesSwapped
		? [...scoreCards].reverse()
		: scoreCards;

	const [showSettings, setShowSettings] = useState(false);

	function handleSettingsUpdate(newSettings: Partial<ScoreboardContext>) {
		send({ type: "EXTERNAL_UPDATE", state: newSettings });
		stateProvider?.updateGame(newSettings);

		if (!initialPlayer1 && !initialPlayer2) {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					bestOf: newSettings.bestOf,
					pointsToWin: newSettings.pointsToWin,
					currentServer: newSettings.currentServer,
					sidesSwapped: newSettings.sidesSwapped,
					player1Name: `${player1.firstName} ${player1.lastName}`.trim(),
					player2Name: `${player2.firstName} ${player2.lastName}`.trim(),
				}),
			);
		}
	}

	function handlePlayersSubmit(newPlayer1: Player, newPlayer2: Player) {
		setPlayer1(newPlayer1);
		setPlayer2(newPlayer2);
		send({
			type: "SET_PLAYERS",
			player1: { ...newPlayer1, id: crypto.randomUUID() },
			player2: { ...newPlayer2, id: crypto.randomUUID() },
		});

		// Only save to localStorage if we don't have initial players
		if (!initialPlayer1 && !initialPlayer2) {
			const currentSettings = getStoredSettings();
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					...currentSettings,
					player1Name: `${newPlayer1.firstName} ${newPlayer1.lastName}`.trim(),
					player2Name: `${newPlayer2.firstName} ${newPlayer2.lastName}`.trim(),
				}),
			);
		}

		setShowSettings(false);
	}

	useEffect(() => {
		if (!state.context.player1.id || !state.context.player2.id) {
			setShowSettings(true);
		}
	}, [state.context.player1.id, state.context.player2.id]);

	return (
		<div className="relative p-0 m-0">
			{!isLandscape && <TopBar />}
			<div className="relative flex flex-col font-['heoric'] justify-between w-screen h-screen">
				{isGameOver && (
					<div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
						<GameConfirmationModal
							player1Score={state.context.player1Score}
							player2Score={state.context.player2Score}
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
							player1GamesWon={state.context.player1GamesWon}
							player2GamesWon={state.context.player2GamesWon}
							onClose={() => {
								send({ type: "RESET_MATCH" });
								stateProvider?.updateGame({
									player1Score: 0,
									player2Score: 0,
									player1GamesWon: 0,
									player2GamesWon: 0,
									currentServer: 0,
									sidesSwapped: false,
								});
							}}
						/>
					</div>
				)}
				{isLandscape ? (
					<LandscapeScoreboard
						state={state}
						send={send}
						orderedScoreCards={orderedScoreCards}
						SetCounter={SetCounter}
						winner={!!winner}
					/>
				) : (
					<PortraitScoreboard
						state={state}
						send={send}
						orderedScoreCards={orderedScoreCards}
						SetCounter={SetCounter}
						winner={!!winner}
					/>
				)}

				<button
					type="button"
					onClick={() => setShowSettings(true)}
					className={cn(
						"absolute right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-[100]",
						isLandscape ? "bottom-8" : "bottom-20",
					)}
				>
					<SettingsIcon className="w-6 h-6" />
				</button>

				<SettingsModal
					isOpen={false}
					onClose={() => setShowSettings(false)}
					settings={{
						bestOf: state.context.bestOf,
						pointsToWin: state.context.pointsToWin,
						currentServer: state.context.currentServer,
						sidesSwapped: state.context.sidesSwapped,
					}}
					onUpdate={handleSettingsUpdate}
					players={{
						player1,
						player2,
					}}
					onPlayersSubmit={
						!state.matches("playing") ? handlePlayersSubmit : undefined
					}
				/>
			</div>
		</div>
	);
}
