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
import { buildMatchesQuery, type Matches } from "@/lib/actions/matches";
import { client } from "@/lib/triplit";
import { useQuery } from "@triplit/react";
import { calculateCurrentScore, formatScore } from "./shared/utils";

export default function PublicMatchList({
	serverMatches,
}: { serverMatches: Matches }) {
	const { results: liveGames } = useQuery(client, client.query("games"));

	const matches = serverMatches
		.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		)
		.map((match) => ({
			...match,
			games: liveGames?.filter((g) => g.match_id === match.id) ?? match.games,
		}));

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Event</TableHead>
					<TableHead>Player 1</TableHead>
					<TableHead>Player 2</TableHead>
					<TableHead>Score</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{matches.filter(Boolean).map((match) => {
					const games = match.games;
					const score = games ? formatScore(calculateCurrentScore(games)) : "-";
					console.log(score);
					return (
						<TableRow key={match.id}>
							<TableCell>{match.event?.name}</TableCell>
							<TableCell>
								<Link
									href={`/users/${match.player1?.id}`}
									className="text-blue-500 underline sm:no-underline sm:hover:underline"
								>
									{match.player1?.first_name} {match.player1?.last_name}
								</Link>
							</TableCell>
							<TableCell>
								<Link
									href={`/users/${match.player2?.id}`}
									className="text-blue-500 underline sm:no-underline sm:hover:underline"
								>
									{match.player2?.first_name} {match.player2?.last_name}
								</Link>
							</TableCell>
							<TableCell>{score}</TableCell>
							<TableCell>
								<Link
									href={`/matches/${match.id}`}
									className="text-blue-500 underline sm:no-underline sm:hover:underline"
								>
									View Match
								</Link>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
