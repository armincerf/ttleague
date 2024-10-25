"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Match } from "@/lib/actions/matches";
import { useQueryOne } from "@triplit/react";
import { client } from "@/lib/triplit";
import {
	padScore,
	getGameNumber,
	calculateCurrentScore,
} from "../shared/utils";

export function PublicMatchView({ serverMatch }: { serverMatch: Match }) {
	const clientMatch = useQueryOne(
		client,
		client
			.query("matches")
			.where([["id", "=", serverMatch?.id ?? ""]])
			.include("player1")
			.include("player2")
			.include("games"),
	);

	// Use client data if available, fall back to server data
	const match = clientMatch.result ?? serverMatch;
	if (!match) return <div>Match not found</div>;

	if (!match.player1 || !match.player2) return <div>Player not found</div>;

	const currentScore = calculateCurrentScore(match.games);

	return (
		<div className="max-w-2xl mx-auto pb-24">
			<h1 className="text-3xl font-bold mb-6">
				Match Location: {serverMatch?.event?.club?.name}
			</h1>
			<h3 className="text-lg font-semibold mb-4">
				Games played - {getGameNumber(match.games)}
			</h3>

			<Card>
				<CardContent>
					<div className="flex flex-col justify-between items-center mb-4 pt-2">
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
							// Show both final and in-progress scores
							const score =
								game.final_score ||
								(game.player_1_score !== undefined &&
								game.player_2_score !== undefined
									? `${game.player_1_score} - ${game.player_2_score}`
									: null);
							if (!score) return null;

							return (
								<li key={game.id}>
									<span className="font-semibold pr-2">Game {idx + 1}:</span>{" "}
									<span className="font-mono">
										{padScore(score)}
										{!game.final_score && " (in progress)"}
									</span>
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
