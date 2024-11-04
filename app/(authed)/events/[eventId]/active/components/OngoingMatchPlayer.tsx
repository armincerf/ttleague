import { MatchScoreCard } from "@/components/MatchScoreCard";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { getDivision } from "@/lib/ratingSystem";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import type { User } from "@/triplit/schema";

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

	return (
		<div className="p-4">
			{!matchEnded && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<h2 className="text-lg font-semibold mb-2">Match in Progress</h2>
					<p className="mb-4">Table {match.table_number}</p>

					<div className="flex justify-between items-center mb-6">
						{players.slice(0, 2).map((player) => (
							<div
								key={player.id}
								className={`text-center ${player.id === userId ? "ring-2 ring-blue-500 rounded-xl p-2" : ""}`}
							>
								{player.profile_image_url && (
									<img
										src={player.profile_image_url}
										alt=""
										className="w-12 h-12 rounded-full mx-auto mb-2"
									/>
								)}
								<span className="block">
									{player.first_name} {player.last_name}
								</span>
							</div>
						))}
					</div>

					<div className="space-y-4">
						<p className="text-sm text-gray-600 text-center">
							Waiting for umpire to record scores...
						</p>
					</div>
				</div>
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
						scores={[
							{
								player1Points: 11,
								player2Points: 9,
								isComplete: true,
								isValid: true,
								isStarted: true,
							},
							{
								player1Points: 9,
								player2Points: 11,
								isComplete: true,
								isValid: true,
								isStarted: true,
							},
							{
								player1Points: 9,
								player2Points: 11,
								isComplete: true,
								isValid: true,
								isStarted: true,
							},
						]}
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
