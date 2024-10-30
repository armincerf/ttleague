"use client";
import { useEffect, useState } from "react";
import type { Player, ScoreboardContext } from "@/lib/scoreboard/machine";
import { GameConfirmationModal } from "./GameConfirmationModal";
import { MatchOverModal } from "./MatchOverModal";
import { getWinner } from "@/lib/scoreboard/utils";
import { SettingsModal } from "./SettingsModal";
import { SettingsIcon } from "lucide-react";
import TopBar from "../TopBar";
import { cn } from "@/lib/utils";
import { LandscapeScoreboard } from "./LandscapeScoreboard";
import { PortraitScoreboard } from "./PortraitScoreboard";
import { useScoreboard, type StateProvider } from "@/lib/hooks/useScoreboard";
import localFont from "next/font/local";
import { ScoreboardProvider } from "@/lib/contexts/ScoreboardContext";

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

export default function Scoreboard({
	player1: initialPlayer1,
	player2: initialPlayer2,
	initialState = {},
	stateProvider,
	loading = false,
}: ScoreboardProps) {
	function handlePlayersSubmit(newPlayer1: Player, newPlayer2: Player) {
		console.log("handlePlayersSubmit", newPlayer1, newPlayer2);
	}

	return (
		<ScoreboardProvider stateProvider={stateProvider}>
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

	const { state, send, isGameOver, isMatchOver } = useScoreboard();

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
	const context = state.context;

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
							player1={context.playerOne}
							player2={context.playerTwo}
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
							player1={context.playerOne}
							player2={context.playerTwo}
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
						player1={context.playerOne}
						player2={context.playerTwo}
						winner={!!getWinner(context)}
					/>
				) : (
					<PortraitScoreboard
						state={state}
						send={send}
						player1={context.playerOne}
						player2={context.playerTwo}
						winner={!!getWinner(context)}
					/>
				)}

				<SettingsModal
					isOpen={showSettings}
					onClose={() => setShowSettings(false)}
					settings={{
						bestOf: context.bestOf,
						pointsToWin: context.pointsToWin,
						playerOneStarts: context.playerOneStarts,
						sidesSwapped: context.sidesSwapped,
					}}
					players={{
						player1: context.playerOne,
						player2: context.playerTwo,
					}}
					onPlayersSubmit={onPlayersSubmit}
				/>
			</div>
		</div>
	);
}
