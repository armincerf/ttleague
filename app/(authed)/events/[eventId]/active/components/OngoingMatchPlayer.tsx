import { type MatchScore, MatchScoreCard } from "@/components/MatchScoreCard";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { getDivision } from "@/lib/ratingSystem";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import type { User } from "@/triplit/schema";
import { LivePlayerScore } from "./LivePlayerScore";
import { useState } from "react";
import { useQuery as useTSQuery } from "@tanstack/react-query";
import { client } from "@/lib/triplit";
import { fetchMatchScores } from "@/lib/matches/queries";

type OngoingMatchPlayerProps = {
	match: TournamentMatch & {
		players: Array<
			| (Partial<User> & {
					id: string;
					profile_image_url: string | undefined;
					first_name: string;
					last_name: string;
			  })
			| undefined
		>;
	};
	tournamentId: string;
	userId: string;
};

export function OngoingMatchPlayer({
	match,
	tournamentId,
	userId,
}: OngoingMatchPlayerProps) {
	const matchEnded = !match.umpireConfirmed;
	const donePlayingAction = useAsyncAction({
		actionName: "Done Playing",
	});
	const players = match.players.filter(Boolean);
	const me = players.find((p) => p?.id === userId);

	const { data = [] } = useTSQuery({
		queryKey: ["matchResult", match.id],
		queryFn: () => fetchMatchScores(match.id),
		enabled: !!matchEnded,
	});
	console.log("data", data);

	return (
		<div className="p-4">
			{!matchEnded && (
				<LivePlayerScore
					matchId={match.id}
					userId={userId}
					player={{
						id: userId,
						scoreKey:
							match.player_1 === userId ? "player_1_score" : "player_2_score",
						name: `${me?.first_name} ${me?.last_name}`,
						avatar: me?.profile_image_url,
					}}
				/>
			)}
			{matchEnded && players && players.length >= 2 && (
				<div className="text-sm text-gray-600 text-center">
					<h1 className="text-2xl font-bold mb-4">Match ended</h1>
					<MatchScoreCard
						table={`Table ${match.table_number}`}
						player1={{
							id: match.player_1,
							name: `${players[0].first_name} ${players[0].last_name}`,
							division: getDivision(players[0].current_division),
							rating: players[0].rating ?? 0,
							avatar: players[0].profile_image_url,
						}}
						player2={{
							id: match.player_2,
							name: `${players[1].first_name} ${players[1].last_name}`,
							division: getDivision(players[1].current_division),
							rating: players[1].rating ?? 0,
							avatar: players[1].profile_image_url,
						}}
						scores={data}
						bestOf={match.best_of}
					/>
					<p>
						If you're done playing for now, click below before the umpire
						submits the scores.
					</p>
					<Button
						loading={donePlayingAction.isLoading}
						variant="destructive"
						className="mt-4"
						onClick={() =>
							donePlayingAction.executeAction(() => {
								return tournamentService.removePlayer(tournamentId, userId);
							})
						}
					>
						I'm done playing
					</Button>
				</div>
			)}
		</div>
	);
}
