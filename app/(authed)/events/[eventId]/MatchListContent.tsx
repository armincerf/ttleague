"use client";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import MatchListSkeleton from "./MatchListSkeleton";
import type { Event } from "@/lib/actions/events";

type MatchListProps = {
	event: NonNullable<Event>;
	status: "in_progress" | "pending" | "completed";
};

export default function MatchListContent({ event, status }: MatchListProps) {
	const matches = event.matches;

	if (!matches) {
		return <MatchListSkeleton />;
	}

	return (
		<div className="mt-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Player 1</TableHead>
						<TableHead>Player 2</TableHead>
						{status === "in_progress" && <TableHead>Current Score</TableHead>}
						{status === "completed" && <TableHead>Final Score</TableHead>}
						<TableHead>Table</TableHead>
						<TableHead>Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{matches.map((match) => (
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
												if (
													game.player_1_score >= 11 ||
													game.player_2_score >= 11
												) {
													return [
														score[0] +
															(game.player_1_score > game.player_2_score
																? 1
																: 0),
														score[1] +
															(game.player_2_score > game.player_1_score
																? 1
																: 0),
													];
												}
												return score;
											},
											[0, 0],
										)
										.join("-")}
								</TableCell>
							)}
							<TableCell>{match.table_number}</TableCell>
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
		</div>
	);
}
