import { useQuery, useQueryOne } from "@triplit/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { client } from "@/lib/triplit";
import { cn } from "@/lib/utils";
import { Triangle } from "lucide-react";
import { motion } from "framer-motion";
import { calculateCurrentServer } from "@/lib/scoreboard/utils";
import { useEffect, useMemo } from "react";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import type { Game as TriplitGame } from "@/triplit/schema";

type LivePlayerScoreProps = {
	match: TournamentMatch | null;
	isP1: boolean;
};

function useGameData(matchId: string | undefined) {
	return useQuery(
		client,
		client
			.query("games")
			.where([["match_id", "=", matchId ?? ""]])
			.select(["sides_swapped", "player_1_score", "player_2_score", "winner"])
			.order("started_at", "DESC"),
	);
}

function usePlayerScoreData(
	match: TournamentMatch | null,
	games: ReturnType<typeof useGameData>["results"],
	swappedSides: boolean,
	isP1: boolean,
) {
	const playerOne = match?.players.find((p) => p?.id === match?.player_1);
	const playerTwo = match?.players.find((p) => p?.id === match?.player_2);
	const currentGame = games?.[0];

	const playerOneGamesWon = games?.filter(
		(g) => g.winner === match?.player_1,
	).length;
	const playerTwoGamesWon = games?.filter(
		(g) => g.winner === match?.player_2,
	).length;
	const playerOneCurrentScore = currentGame?.player_1_score ?? 0;
	const playerTwoCurrentScore = currentGame?.player_2_score ?? 0;

	const visiblePlayerIsP1 = isP1 !== swappedSides;

	return {
		currentScore: visiblePlayerIsP1
			? playerOneCurrentScore
			: playerTwoCurrentScore,
		gamesWon: visiblePlayerIsP1 ? playerOneGamesWon : playerTwoGamesWon,
		name: visiblePlayerIsP1 ? playerOne?.first_name : playerTwo?.first_name,
		avatar: visiblePlayerIsP1
			? playerOne?.profile_image_url
			: playerTwo?.profile_image_url,
		playerOne,
		playerTwo,
		playerOneCurrentScore,
		playerTwoCurrentScore,
		playerOneGamesWon,
		playerTwoGamesWon,
	};
}

function useWakeLock() {
	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;

		async function requestWakeLock() {
			try {
				wakeLock = await navigator.wakeLock.request("screen");
			} catch (err) {
				console.error("Wake Lock request failed:", err);
			}
		}

		if ("wakeLock" in navigator) {
			void requestWakeLock();
		}

		return () => {
			void wakeLock?.release();
		};
	}, []);
}

export function LivePlayerScore({ match, isP1 }: LivePlayerScoreProps) {
	const { results: games } = useGameData(match?.id);
	const currentGame = games?.[0];
	const swappedSides = !!currentGame?.sides_swapped;
	const side = isP1 ? "left" : "right";

	const {
		currentScore,
		gamesWon,
		name,
		avatar,
		playerOne,
		playerTwo,
		playerOneCurrentScore,
		playerTwoCurrentScore,
		playerOneGamesWon,
		playerTwoGamesWon,
	} = usePlayerScoreData(match, games, swappedSides, isP1);

	const servingPlayer = useMemo(
		() =>
			calculateCurrentServer({
				playerOne: {
					currentScore: playerOneCurrentScore,
					gamesWon: playerOneGamesWon ?? 0,
					firstName: playerOne?.first_name ?? "",
				},
				playerTwo: {
					currentScore: playerTwoCurrentScore,
					gamesWon: playerTwoGamesWon ?? 0,
					firstName: playerTwo?.first_name ?? "",
				},
				pointsToWin: 11,
				playerOneStarts: true,
			}),
		[
			playerOneCurrentScore,
			playerTwoCurrentScore,
			playerOneGamesWon,
			playerTwoGamesWon,
			playerOne?.first_name,
			playerTwo?.first_name,
		],
	);

	useWakeLock();

	return (
		<div className="absolute top-0 left-0 w-full h-full z-[200] bg-white flex flex-col items-center justify-center overflow-hidden">
			{gamesWon !== undefined && (
				<div
					className={cn(
						"absolute top-2 text-red-500 font-bold text-9xl",
						side === "left" ? "left-4" : "right-4",
					)}
				>
					{gamesWon}
				</div>
			)}
			<div
				className={cn(
					"absolute top-0 font-bold",
					currentScore < 10 ? "text-[60vh]" : "text-[40vh] top-20",
				)}
			>
				{currentScore}
			</div>
			<div className="flex items-center gap-2 mt-4 absolute bottom-4">
				{servingPlayer === name ? (
					<motion.div
						initial={{ x: -30, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.3, ease: "easeInOut", delay: 0.4 }}
						className="flex justify-center w-16"
					>
						<Triangle className="w-16 h-16 rotate-90 text-red-500 fill-red-500 opacity-80" />
					</motion.div>
				) : (
					<div className="flex justify-center w-16 h-16" />
				)}
				{avatar && (
					<Avatar>
						<AvatarImage src={avatar} alt={name} />
					</Avatar>
				)}
				<span className="text-3xl font-medium">{name}</span>
			</div>
		</div>
	);
}
