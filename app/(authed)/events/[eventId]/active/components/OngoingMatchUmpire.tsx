import { MatchScoreCard } from "@/components/MatchScoreCard";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { getDivision } from "@/lib/ratingSystem";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import type { User } from "@/triplit/schema";
import { useUser } from "@clerk/nextjs";

type OngoingMatchUmpireProps = {
	match: TournamentMatch & {
		players:
			| Array<
					| (Partial<User> & {
							id: string;
							profile_image_url: string | undefined;
							first_name: string;
							last_name: string;
					  })
					| undefined
			  >
			| undefined;
	};
	userId: string;
};

export function OngoingMatchUmpire({ match, userId }: OngoingMatchUmpireProps) {
	const endMatchAction = useAsyncAction({
		actionName: "Umpire - End Match",
	});
	const awaitingUmpireConfirmation = !match.umpireConfirmed;
	const { user } = useUser();
	const players = match.players?.filter(Boolean);
	return (
		<div className="p-4">
			{!awaitingUmpireConfirmation && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h2 className="text-lg font-semibold mb-2">Umpiring Match</h2>
					<p className="mb-4">Table {match.table_number}</p>

					<div className="flex justify-between items-center mb-6">
						{players?.slice(0, 2).map((player) => (
							<div key={player.id} className="text-center">
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
						{/* Score input controls would go here */}
						<p className="text-sm text-gray-600 text-center">
							Use the controls below to record scores
						</p>
						<Button
							onClick={() =>
								players &&
								players.length >= 2 &&
								endMatchAction.executeAction(() =>
									tournamentService.matchConfirmation.confirmWinner(
										match.id,
										players[0].id,
									),
								)
							}
						>
							End Match
						</Button>
					</div>
				</div>
			)}
			{awaitingUmpireConfirmation && players && players.length >= 2 && (
				<div className="text-sm text-gray-600 text-center">
					<h1 className="text-2xl font-bold mb-4">Match ended</h1>
					<MatchScoreCard
						table={`Table ${match.table_number}`}
						umpire={`${user?.firstName} ${user?.lastName}`}
						player1={{
							id: players[0].id,
							name: `${players[0].first_name} ${players[0].last_name}`,
							division: getDivision(players[0].current_division),
							rating: players[0].rating ?? 0,
							avatar: players[0].profile_image_url,
						}}
						player2={{
							id: players[1].id,
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
						If the players are happy the above score is correct, please confirm
						and give them a chance to leave the event if they want. When you
						press the button below everyone on this table will be allocated a
						new match.
					</p>
					<Button
						className="my-4"
						onClick={() =>
							endMatchAction.executeAction(() =>
								tournamentService.matchConfirmation.confirmMatchUmpire(
									match.id,
									userId,
								),
							)
						}
					>
						Confirm and allocate new matches
					</Button>
				</div>
			)}
		</div>
	);
}
