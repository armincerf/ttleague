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
import { useEntity } from "@triplit/react";
import { client } from "@/lib/triplit";
import { useAuth } from "@clerk/nextjs";

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
	persistState?: boolean;
	showTopBar?: boolean;
}

export default function Scoreboard({
	player1: initialPlayer1,
	player2: initialPlayer2,
	persistState = false,
	stateProvider,
	loading = false,
	showTopBar = false,
}: ScoreboardProps) {
	function handlePlayersSubmit(newPlayer1: Player, newPlayer2: Player) {
		console.log("handlePlayersSubmit", newPlayer1, newPlayer2);
	}

	const { userId } = useAuth();
	const user = useEntity(client, "users", userId ?? "");
	console.log("user", initialPlayer1, initialPlayer2);

	return (
		<ScoreboardProvider
			persistState={persistState}
			stateProvider={stateProvider}
		>
			<ScoreboardContent
				loading={loading}
				onPlayersSubmit={handlePlayersSubmit}
				showTopBar={showTopBar}
				initialPlayer1={
					initialPlayer1 || {
						firstName: user?.result?.first_name,
						lastName: user?.result?.last_name,
						id: user?.result?.id ?? "player1?",
						gamesWon: 0,
						currentScore: 0,
						matchPoint: false,
					}
				}
				initialPlayer2={
					initialPlayer2 || {
						firstName: "Player",
						lastName: "2",
						id: "player2?",
						gamesWon: 0,
						currentScore: 0,
						matchPoint: false,
					}
				}
			/>
		</ScoreboardProvider>
	);
}

function ScoreboardContent({
	loading,
	onPlayersSubmit,
	showTopBar,
	initialPlayer1,
	initialPlayer2,
}: {
	loading: boolean;
	onPlayersSubmit: (player1: Player, player2: Player) => void;
	showTopBar?: boolean;
	initialPlayer1?: Player;
	initialPlayer2?: Player;
}) {
	const [isLandscape, setIsLandscape] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	const { state, send, isGameOver, isMatchOver } = useScoreboard();

	useEffect(() => {
		send({
			type: "UPDATE_PLAYER",
			isPlayerOne: true,
			firstName: initialPlayer1?.firstName ?? "Player",
			lastName: initialPlayer1?.lastName ?? "1",
			id: initialPlayer1?.id ?? "player1?",
			gamesWon: initialPlayer1?.gamesWon ?? 0,
		});
	}, [initialPlayer1, send]);

	useEffect(() => {
		send({
			type: "UPDATE_PLAYER",
			isPlayerOne: false,
			firstName: initialPlayer2?.firstName ?? "Player",
			lastName: initialPlayer2?.lastName ?? "2",
			id: initialPlayer2?.id ?? "player2?",
			gamesWon: initialPlayer2?.gamesWon ?? 0,
		});
	}, [initialPlayer2, send]);

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
			// @ts-ignore
			document.documentElement.style.zoom = "100%";
		}, 500);
		return () => window.removeEventListener("resize", handleOrientationChange);
	}, []);
	const context = state.context;

	return (
		<div className={`relative p-0 m-0 ${impact.variable} w-full h-full`}>
			{showTopBar && !isLandscape && <TopBar />}
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
						disableAnimations: context.disableAnimations,
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
