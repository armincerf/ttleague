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
			const isGameOver = game.player_1_score >= 11 || game.player_2_score >= 11;
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
								const finalScore = `${game.player_1_score}-${game.player_2_score}`;
								if (game.player_1_score >= 11 || game.player_2_score >= 11) {
									return (
										<li key={game.id}>
											<span className="font-semibold pr-2">Game {idx}:</span>{" "}
											<span className="font-mono">{padScore(finalScore)}</span>
										</li>
									);
								}
								return null;
							})}
						</ul>
					</CardContent>
				</Card>
			</div>
		</>
	);
}

export default function MatchView({ serverMatch }: { serverMatch: Match }) {
	return (
		<>
			<MatchView2 serverMatch={serverMatch} />
		</>
	);
}
