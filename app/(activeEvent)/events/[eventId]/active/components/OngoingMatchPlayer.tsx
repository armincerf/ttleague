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
import { calculateCurrentServer } from "@/lib/scoreboard/utils";

type OngoingMatchPlayerProps = {
	match: TournamentMatch;
	tournamentId: string;
	userId: string;
};

export function OngoingMatchPlayer({
	match,
	tournamentId,
	userId,
}: OngoingMatchPlayerProps) {
	const [hasClickedRest, setHasClickedRest] = useState(false);
	const matchEnded = !match.umpireConfirmed;
	const donePlayingAction = useAsyncAction({
		actionName: "Done Playing",
	});
	const players = match.players.filter(Boolean);
	const playerOne = players.find((p) => p?.id === match.player_1);
	const playerTwo = players.find((p) => p?.id === match.player_2);

	const { data = [] } = useTSQuery({
		queryKey: ["matchResult", match.id],
		queryFn: () => fetchMatchScores(match.id ?? ""),
		enabled: !!matchEnded && !!match.id,
	});

	const isP1 = match.player_1 === userId;

	return (
		<div className="p-4">
			{!matchEnded && match.id && <LivePlayerScore match={match} isP1={isP1} />}
			{matchEnded &&
				players &&
				match.player_1 &&
				match.player_2 &&
				match.best_of &&
				players.length >= 2 && (
					<div className="text-sm text-gray-600 text-center">
						<h1 className="text-2xl font-bold mb-4">Match ended</h1>
						<MatchScoreCard
							tableNumber={match.table_number}
							leagueName="MK Singles League"
							eventDate={match.startTime}
							isManuallyCreated={match.manually_created}
							player1={{
								id: match.player_1,
								name: `${players[0].first_name} ${players[0].last_name}`,
								division: getDivision(players[0].current_division),
								rating: 0,
								avatar: players[0].profile_image_url,
							}}
							player2={{
								id: match.player_2,
								name: `${players[1].first_name} ${players[1].last_name}`,
								division: getDivision(players[1].current_division),
								rating: 0,
								avatar: players[1].profile_image_url,
							}}
							scores={data}
							bestOf={match.best_of}
						/>
						<p className="text-gray-600 text-sm mt-4 mb-6">
							Please wait for the umpire to confirm the scores.
						</p>
					</div>
				)}
		</div>
	);
}
