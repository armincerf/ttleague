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
import { MatchScoreCard } from "@/components/MatchScoreCard";
import { getDivision } from "@/lib/ratingSystem";

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

	const scores = match.games.map((game) => ({
		player1Points: game.player_1_score,
		player2Points: game.player_2_score,
		isValid: true,
		startedAt: game.started_at,
	}));

	console.log(scores);
	return (
		<div className="p-4">
			<div className="text-sm text-gray-600 text-center">
				<h1 className="text-2xl font-bold mb-4">Match Details</h1>
				<MatchScoreCard
					table={`Table ${match.table_number}`}
					player1={{
						id: match.player1.id,
						name: `${match.player1.first_name} ${match.player1.last_name}`,
						division: getDivision(match.player1.current_division),
						rating: match.player1.rating ?? 0,
						avatar: match.player1.profile_image_url,
					}}
					player2={{
						id: match.player2.id,
						name: `${match.player2.first_name} ${match.player2.last_name}`,
						division: getDivision(match.player2.current_division),
						rating: match.player2.rating ?? 0,
						avatar: match.player2.profile_image_url,
					}}
					scores={scores}
					bestOf={match.best_of ?? 5}
				/>
			</div>
		</div>
	);
}

export default function MatchView({ serverMatch }: { serverMatch: Match }) {
	return (
		<>
			<MatchView2 serverMatch={serverMatch} />
		</>
	);
}
