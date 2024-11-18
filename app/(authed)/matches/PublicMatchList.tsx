"use client";
import { useRouter, useSearchParams } from "next/navigation";
import MatchHistoryTable from "@/components/MatchHistoryTable";
import type { Matches } from "@/lib/actions/matches";
import { client } from "@/lib/triplit";
import type { Game } from "@/triplit/schema";
import { useQuery } from "@triplit/react";

export default function PublicMatchList({
	serverMatches,
}: { serverMatches: Matches }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const selectedUser = searchParams.get("selectedUser");

	const handleUserSelect = (userId: string) => {
		const params = new URLSearchParams(searchParams);
		if (userId) {
			params.set("selectedUser", userId);
		} else {
			params.delete("selectedUser");
		}
		router.push(`/matches?${params.toString()}`);
	};

	const { results: liveGames } = useQuery(client, client.query("games"));

	// Transform serverMatches into the format expected by MatchHistoryTable
	const transformedMatches = serverMatches
		.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		)
		.map((match) => {
			if (match?.player2 === null || match?.player1 === null) return null;

			const player =
				selectedUser === match.player2?.id ? match.player2 : match.player1;
			const opponent =
				selectedUser === match.player2?.id ? match.player1 : match.player2;

			return {
				...match,
				games: liveGames?.filter((g) => g.match_id === match.id) ?? match.games,
				// Add required fields for MatchHistoryTable
				date: new Date(match.created_at),
				player,
				opponent,
				result: match.winner === player?.id ? "win" : "loss",
				scores: match.games
					.sort(
						(a, b) =>
							new Date(a.created_at).getTime() -
							new Date(b.created_at).getTime(),
					)
					.map((game) => ({
						player1Points: game.player_1_score,
						player2Points: game.player_2_score,
						isValid: game.player_1_score >= 11 || game.player_2_score >= 11,
					})),
				ratingChange: 0,
				bestOf: match.best_of,
				tableNumber: match.table_number,
				isManuallyCreated: match.manually_created,
				umpire: match.umpireUser,
			} satisfies Parameters<typeof MatchHistoryTable>[0]["matches"][number] & {
				games: Game[];
			};
		})
		.filter(Boolean);

	return (
		<div className="sm:p-8">
			<MatchHistoryTable
				matches={transformedMatches}
				currentUserId={selectedUser ?? ""}
				pageSize={20}
				onUserSelect={handleUserSelect}
				allowUserSelect={true}
			/>
		</div>
	);
}
