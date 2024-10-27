"use client";
import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import type { Match } from "@/lib/actions/matches";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecordScoreForm from "./RecordScoreForm";
import { getGameNumber } from "./utils";
import {
	Dispatch,
	type RefObject,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../../components/ui/button";

export function MatchView2({ serverMatch }: { serverMatch: Match }) {
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		function handleOrientationChange() {
			const isLandscapeMobile = window.matchMedia(
				"(max-width: 1024px) and (orientation: landscape)",
			).matches;
			setIsLandscape(isLandscapeMobile);
		}

		handleOrientationChange();
		window.addEventListener("resize", handleOrientationChange);
		return () => window.removeEventListener("resize", handleOrientationChange);
	}, []);

	const clientMatch = useQueryOne(
		client,
		client
			.query("matches")
			.where([["id", "=", serverMatch.id]])
			.include("player1")
			.include("player2")
			.include("games"),
	);
	const match = clientMatch.result ?? serverMatch;
	if (!match.player1 || !match.player2) return null;

	const currentScore = match.games.reduce(
		(acc, game) => {
			const isGameOver = !!game.final_score;
			if (isGameOver) {
				const isP1Win = game.player_1_score > game.player_2_score;
				return isP1Win ? [acc[0] + 1, acc[1]] : [acc[0], acc[1] + 1];
			}
			return acc;
		},
		[0, 0],
	);

	function padScore(score: string | null): string {
		if (!score) return "\u00A0\u00A0\u00A0-\u00A0\u00A0\u00A0";
		const [score1, score2] = score.split("-").map((s) => s.trim());
		return `${score1.padStart(2, "\u00A0")} - ${score2.padStart(2, "\u00A0")}`;
	}

	if (isLandscape) {
		return <RecordScoreForm match={match} fullscreen />;
	}

	return (
		<>
			<div className="max-w-2xl mx-auto pb-24">
				<h1 className="text-3xl font-bold mb-6">Table {match.table_number}</h1>
				<h3 className="text-lg font-semibold mb-4">
					Games played - {getGameNumber(match.games)}
				</h3>

				<Card>
					<CardContent>
						<div className="flex flex-col  justify-between items-center mb-4 pt-2">
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={match.player1.profile_image_url} />
									<AvatarFallback>
										{match.player1.first_name[0]}
										{match.player1.last_name[0]}
									</AvatarFallback>
								</Avatar>
								<span>
									{match.player1.first_name} {match.player1.last_name} -{" "}
									{currentScore[0]}
								</span>
							</div>
							<span className="font-bold">vs</span>
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={match.player2.profile_image_url} />
									<AvatarFallback>
										{match.player2.first_name[0]}
										{match.player2.last_name[0]}
									</AvatarFallback>
								</Avatar>
								<span>
									{match.player2.first_name} {match.player2.last_name} -{" "}
									{currentScore[1]}
								</span>
							</div>
						</div>
						<ul>
							{match.games.map((game, idx) => {
								if (!game.final_score) return null;
								return (
									<li key={game.id}>
										<span className="font-semibold pr-2">Game {idx}:</span>{" "}
										<span className="font-mono">
											{padScore(game.final_score)}
										</span>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>
				<RecordScoreForm match={match} />
			</div>
		</>
	);
}

export default function MatchView({ serverMatch }: { serverMatch: Match }) {
	return (
		<>
			{/* <MatchView2 serverMatch={serverMatch} /> */}
			<Scoreboard2 serverMatch={serverMatch} />
		</>
	);
}

function ScoreCard({
	score,
	correction,
	serveTurn,
	setServeTurn,
	handleScoreChange,
	player,
}: {
	score: number;
	correction: boolean;
	setServeTurn: () => void;
	handleScoreChange: (score: number) => unknown;
	serveTurn: boolean;
	player: string;
}) {
	const [isFlipping, setIsFlipping] = useState(false);

	const handleClick = () => {
		console.log("in on lcikc", score);
		setIsFlipping(true);
		handleScoreChange(score + 1);
		setTimeout(() => setIsFlipping(false), 500);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="relative bg-white">
				<p className="absolute top-0 pt-2 flex justify-center w-full text-5xl uppercase">
					{player}
				</p>
				<button
					type="button"
					className="w-full  overflow-hidden relative cursor-pointer"
					onClick={handleClick}
				>
					<AnimatePresence initial={false} mode="popLayout">
						<motion.div
							key={score}
							initial={{ rotateX: isFlipping ? -90 : 0, opacity: 0 }}
							animate={{ rotateX: 0, opacity: 1 }}
							exit={{ rotateX: 90, opacity: 0 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 30,
								mass: 1,
								duration: 0.5,
							}}
							className="w-full h-full flex items-center justify-center text-[12rem] font-bold"
						>
							{score}
						</motion.div>
					</AnimatePresence>
				</button>
				{(serveTurn || correction) && (
					<button
						type="button"
						className="absolute left-0 bottom-0 flex justify-center p-2"
						onClick={setServeTurn}
					>
						<svg
							className={
								correction && !serveTurn
									? "stroke-red-500 fill-none"
									: "fill-red-500"
							}
							width="60"
							height="30"
							viewBox="0 0 60 30"
							aria-hidden="true"
						>
							<title>Serve indicator</title>
							<path
								d="M1 29L30 1L59 29H1Z"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeDasharray={correction && !serveTurn ? "4 4" : "0"}
							/>
						</svg>
					</button>
				)}
			</div>
			{correction && (
				<div className="flex flex-col gap-2">
					<button
						onClick={() => handleScoreChange(score + 1)}
						className="w-full bg-red-500 py-1 uppercase text-2xl text-white"
						type="button"
					>
						add point
					</button>
					<button
						onClick={() => handleScoreChange(Math.max(0, score - 1))}
						className="w-full bg-red-500 py-1 uppercase text-2xl text-white"
						type="button"
					>
						subtract point
					</button>
				</div>
			)}
		</div>
	);
}

function SetCounter({ count }: { count: number }) {
	return (
		<div className="bg-white text-red-500 text-[10rem] py-4 leading-none w-full flex items-start justify-center">
			{count}
		</div>
	);
}

export function Scoreboard2({ serverMatch }: { serverMatch: Match }) {
	const [leftSets, setLeftSets] = useState(1);
	const [rightSets, setRightSets] = useState(2);
	const [correction, setCorrectionMode] = useState(false);
	const [serveTurn, setServeTurn] = useState<0 | 1>(0);
	const [gameId, setGameId] = useState<string>();

	const handleScoreChange = async (
		fieldName: "player1Score" | "player2Score",
		newValue: number,
	) => {
		const now = new Date();
		console.log("in here ");
		const gameNumber = getGameNumber(match.games ?? []);
		const id = `${match.id}-${gameNumber}`;
		const potentialGameId = `game-${id}`;
		if (!gameId) {
			const existingGame = await client.fetchById("games", potentialGameId, {
				policy: "local-only",
			});
			if (existingGame) {
				setGameId(existingGame.id);
			}
		}

		if (!gameId) {
			// Create new game on first score
			const newGameId = `game-${match.id}-${gameNumber - 1}`;

			await client.insert("games", {
				id: newGameId,
				match_id: match.id,
				player_1_score: fieldName === "player1Score" ? newValue : 0,
				player_2_score: fieldName === "player2Score" ? newValue : 0,
				started_at: now,
				last_edited_at: now,
				game_number: gameNumber,
			});

			setGameId(newGameId);
		} else {
			console.log("should be here", newValue);
			await client.update("games", gameId, (game) => {
				if (fieldName === "player1Score") {
					game.player_1_score = newValue;
				} else {
					game.player_2_score = newValue;
				}
				game.last_edited_at = now;
			});
		}
	};

	const clientMatch = useQueryOne(
		client,
		client
			.query("matches")
			.where([["id", "=", serverMatch.id]])
			.include("player1")
			.include("player2")
			.include("games"),
	);
	const match = clientMatch.result ?? serverMatch;
	if (!match.player1 || !match.player2) return null;

	const currentScore = match.games.reduce(
		(acc, game) => {
			const isGameOver = !!game.final_score;
			if (isGameOver) {
				const isP1Win = game.player_1_score > game.player_2_score;
				return isP1Win ? [acc[0] + 1, acc[1]] : [acc[0], acc[1] + 1];
			}
			return acc;
		},
		[0, 0],
	);

	console.log("score", currentScore);

	function setPlayerServingTurn(playerNumber: 0 | 1) {
		return () => setServeTurn(playerNumber);
	}

	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		function handleOrientationChange() {
			const isLandscapeMobile = window.matchMedia(
				"(max-width: 1024px) and (orientation: landscape)",
			).matches;

			setIsLandscape(isLandscapeMobile);

			if (isLandscapeMobile) {
				setCorrectionMode(false);
			}
		}

		handleOrientationChange();
		window.addEventListener("resize", handleOrientationChange);
		return () => window.removeEventListener("resize", handleOrientationChange);
	}, []);

	return (
		<div className="flex flex-col font-['heoric'] justify-between h-full">
			<div
				className={`${
					isLandscape
						? "fixed inset-0 p-12 bg-black z-50 flex flex-col justify-center items-center"
						: "p-0"
				}`}
			>
				<div className="bg-black p-2 shadow-2xl w-full  font-">
					<div className="flex justify-between items-start mb-4 gap-2">
						<div className="w-[15%]">
							<SetCounter count={leftSets} />
						</div>
						<div className="w-[35%]">
							<ScoreCard
								player={`${match.player1.first_name[0]}${match.player1.last_name[0]}`}
								score={currentScore[0]}
								handleScoreChange={(score: number) =>
									handleScoreChange("player1Score", score)
								}
								correction={correction}
								serveTurn={serveTurn === 0}
								setServeTurn={setPlayerServingTurn(0)}
							/>
						</div>
						<div className="w-[35%]">
							<ScoreCard
								player={`${match.player1.first_name[1]}${match.player1.last_name[1]}`}
								score={currentScore[1]}
								handleScoreChange={(score: number) =>
									handleScoreChange("player1Score", score)
								}
								correction={correction}
								serveTurn={serveTurn === 1}
								setServeTurn={setPlayerServingTurn(1)}
							/>
						</div>
						<div className="w-[15%]">
							<SetCounter count={rightSets} />
						</div>
					</div>

					<div className="flex justify-between items-end">
						<TimeOutLabel />
						<div className="text-white text-center text-9xl">DONIC</div>
						<TimeOutLabel />
					</div>
				</div>
			</div>
			{!isLandscape && (
				<div className="flex justify-center items-end py-10">
					<button
						type="button"
						onClick={() => setCorrectionMode((prev) => !prev)}
						className={`${correction ? "bg-red-500" : "bg-black"} text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase`}
					>
						{correction ? "resume game" : "correction"}
					</button>
				</div>
			)}
		</div>
	);
}

function TimeOutLabel() {
	return (
		<div className="bg-white rounded-sm text-center text-black text-2xl font-bold leading-6 py-1 px-2">
			TIME <br /> OUT
		</div>
	);
}
