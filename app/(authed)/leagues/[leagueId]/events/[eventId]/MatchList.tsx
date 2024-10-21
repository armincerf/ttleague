"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/triplit";
import { useQuery } from "@triplit/react";
import Link from "next/link";

type MatchListProps = {
	title: string;
	eventId: string;
	status: "in_progress" | "pending" | "completed";
};

export default function MatchList({ title, eventId, status }: MatchListProps) {
	const { results: matches } = useQuery(
		client,
		client
			.query("matches")
			.where([["event_id", "=", eventId]])
			.include("player1")
			.include("player2")
			.include("games")
			.build(),
	);

	if (!matches) {
		return null;
	}

	const filteredMatches = matches.filter((match) => {
		if (status === "in_progress") {
			return match.status === "confirmed";
		}
		if (status === "pending") {
			return match.status === "pending";
		}
		if (status === "completed") {
			return !!match.winner;
		}
		return false;
	});

	if (filteredMatches.length === 0) {
		return null;
	}

	return (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Player 1</TableHead>
							<TableHead>Player 2</TableHead>
							{status === "in_progress" && <TableHead>Current Score</TableHead>}
							{status === "completed" && <TableHead>Final Score</TableHead>}
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredMatches.map((match) => (
							<TableRow key={match.id}>
								<TableCell>
									{match.player1?.first_name} {match.player1?.last_name}
								</TableCell>
								<TableCell>
									{match.player2?.first_name} {match.player2?.last_name}
								</TableCell>
								{(status === "in_progress" || status === "completed") && (
									<TableCell>
										{match.games
											.reduce(
												(score, game) => {
													if (game.final_score) {
														const [player1Score, player2Score] =
															game.final_score.split("-").map(Number);
														return [
															score[0] + (player1Score > player2Score ? 1 : 0),
															score[1] + (player2Score > player1Score ? 1 : 0),
														];
													}
													return score;
												},
												[0, 0],
											)
											.join("-")}
									</TableCell>
								)}
								<TableCell>
									<Link
										href={`/matches/${match.id}`}
										className="text-blue-500 underline sm:no-underline sm:hover:underline"
									>
										View Match
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
