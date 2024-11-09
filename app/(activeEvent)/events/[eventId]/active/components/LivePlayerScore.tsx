import { useQuery, useQueryOne } from "@triplit/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { client } from "@/lib/triplit";
import { cn } from "@/lib/utils";
import { Triangle } from "lucide-react";
import { motion } from "framer-motion";
import { calculateCurrentServer } from "@/lib/scoreboard/utils";
import { useEffect } from "react";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";

type LivePlayerScoreProps = {
	match: TournamentMatch | null;
	isP1: boolean;
};

export function LivePlayerScore({ match, isP1 }: LivePlayerScoreProps) {
	const { results: games } = useQuery(
		client,
		client
			.query("games")
			.where([["match_id", "=", match?.id ?? ""]])
			.select(["sides_swapped", "player_1_score", "player_2_score", "winner"])
			.order("started_at", "DESC"),
	);
	const currentGame = games?.[0];
	const swappedSides = !!currentGame?.sides_swapped;

	const playerOneGamesWon = games?.filter(
		(g) => g.winner === match?.player_1,
	).length;
	const playerTwoGamesWon = games?.filter(
		(g) => g.winner === match?.player_2,
	).length;
	const side = isP1 ? "left" : "right";
	const playerOne = match?.players.find((p) => p?.id === match?.player_1);
	const playerTwo = match?.players.find((p) => p?.id === match?.player_2);
	const playerOneCurrentScore = currentGame?.player_1_score ?? 0;
	const playerTwoCurrentScore = currentGame?.player_2_score ?? 0;
	// The device on the left always shows player 1 unless the sides are swapped
	const visiblePlayerIsP1 = isP1 !== swappedSides;
	const currentScore = visiblePlayerIsP1
		? playerOneCurrentScore
		: playerTwoCurrentScore;
	const servingPlayer = calculateCurrentServer({
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
	});

	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;

		async function requestWakeLock() {
			try {
				wakeLock = await navigator.wakeLock.request("screen");
			} catch (err) {
				console.error("Wake Lock request failed:", err);
			}
		}

		// Request wake lock if the API is available
		if ("wakeLock" in navigator) {
			void requestWakeLock();
		}

		// Cleanup function to release wake lock
		return () => {
			void wakeLock?.release();
		};
	}, []);
	const gamesWon = visiblePlayerIsP1 ? playerOneGamesWon : playerTwoGamesWon;
	const name = visiblePlayerIsP1
		? playerOne?.first_name
		: playerTwo?.first_name;
	const avatar = visiblePlayerIsP1
		? playerOne?.profile_image_url
		: playerTwo?.profile_image_url;

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
				{servingPlayer === name && (
					<motion.div
						initial={{ x: -30, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.3, ease: "easeInOut", delay: 0.4 }}
						className="flex justify-center w-8"
					>
						<Triangle className="w-8 h-8 rotate-90 text-red-500 fill-red-500 opacity-80" />
					</motion.div>
				)}
				{avatar && (
					<Avatar>
						<AvatarImage src={avatar} alt={name} />
					</Avatar>
				)}
				<span className="text-lg font-medium">{name}</span>
			</div>
		</div>
	);
}
