import { MatchScoreCard } from "@/components/MatchScoreCard";
import Scoreboard from "@/components/scoreboard/Scoreboard";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { getDivision } from "@/lib/ratingSystem";
import { getWinner } from "@/lib/scoreboard/utils";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { client } from "@/lib/triplit";
import type { User } from "@/triplit/schema";
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryOne } from "@triplit/react";
import { useEffect } from "react";
import { fetchMatchScores } from "@/lib/matches/queries";
import { useQuery as useTSQuery } from "@tanstack/react-query";

type OngoingMatchUmpireProps = {
	match: TournamentMatch;
	userId: string;
};

export function OngoingMatchUmpire({ match, userId }: OngoingMatchUmpireProps) {
	const endMatchAction = useAsyncAction({
		actionName: "Umpire - End Match",
	});
	const awaitingUmpireConfirmation = !match.umpireConfirmed;
	const { user } = useUser();
	const players = match.players?.filter(Boolean);
	const playerOne = players?.find((player) => player?.id === match.player_1);
	const playerTwo = players?.find((player) => player?.id === match.player_2);
	const { results: currentGames } = useQuery(
		client,
		client
			.query("games")
			.where(["match_id", "=", match.id ?? ""])
			.order("started_at", "DESC")
			.build(),
	);
	const playerOneGamesWon =
		currentGames?.filter((game) => game.winner === match.player_1).length ?? 0;
	const playerTwoGamesWon =
		currentGames?.filter((game) => game.winner === match.player_2).length ?? 0;
	const currentGame =
		currentGames?.[0] && !currentGames[0].completed_at ? currentGames[0] : null;
	const playerOneScore = currentGame?.player_1_score ?? 0;
	const playerTwoScore = currentGame?.player_2_score ?? 0;
	const bestOf = match.best_of ?? 3;
	const gamesNeededToWin = Math.floor(bestOf / 2) + 1;

	const { data: scores = [] } = useTSQuery({
		queryKey: ["matchResult", match.id],
		queryFn: () => fetchMatchScores(match.id ?? ""),
		enabled: !!awaitingUmpireConfirmation && !!match.id,
	});

	useEffect(() => {
		if (
			(playerOneGamesWon >= gamesNeededToWin ||
				playerTwoGamesWon >= gamesNeededToWin) &&
			!awaitingUmpireConfirmation
		) {
			if (!match.id) return;
			endMatchAction.executeAction(() => {
				if (!match.id || !match.player_1 || !match.player_2) {
					return Promise.reject(new Error("Match ID is required"));
				}
				return tournamentService.matchConfirmation.confirmWinner(
					match.id,
					playerOneGamesWon === gamesNeededToWin
						? match.player_1
						: match.player_2,
				);
			});
		}
	}, [
		awaitingUmpireConfirmation,
		match.id,
		playerOneGamesWon,
		playerTwoGamesWon,
		match.player_1,
		match.player_2,
		endMatchAction.executeAction,
		gamesNeededToWin,
	]);
	return (
		<>
			{!awaitingUmpireConfirmation && playerOne?.id && playerTwo?.id && (
				<div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 w-full shadow-lg">
					<h2 className="text-2xl font-bold mb-4 text-center">Active Match</h2>
					<div className="text-center mb-6">
						<div className="text-xl font-semibold bg-green-100 rounded-lg py-2 px-4 inline-block">
							Table {match.table_number}
						</div>
					</div>
					<Scoreboard
						persistState={false}
						showTopBar={false}
						stateProvider={{
							onGameComplete: async (state) => {
								const playerOneScore = state.playerOne.currentScore;
								const playerTwoScore = state.playerTwo.currentScore;
								if (!currentGames || currentGames.length === 0) return;
								await client.update("games", currentGames[0].id, (game) => {
									game.player_1_score = playerOneScore;
									game.player_2_score = playerTwoScore;
									game.updated_at = new Date();
									game.updated_by = userId;
									game.winner =
										playerOneScore > playerTwoScore
											? match.player_1
											: match.player_2;
								});
								const playerOneWonGame = playerOneScore > playerTwoScore;
								const isMatchOver = playerOneWonGame
									? playerOneGamesWon + 1 >= gamesNeededToWin
									: playerTwoGamesWon + 1 >= gamesNeededToWin;
								if (isMatchOver || !match.id) return;
								await client.insert("games", {
									match_id: match.id,
									game_number: currentGames[0].game_number + 1,
									player_1_score: 0,
									player_2_score: 0,
									updated_by: userId,
									sides_swapped: !state.sidesSwapped,
								});
							},
							updateScore: async (playerId, score, sidesSwapped) => {
								console.log("updateScore", playerId, score);
								if (!currentGames || currentGames.length === 0) return;
								await client.update("games", currentGames[0].id, (game) => {
									game.sides_swapped = sidesSwapped;
									if (playerId === match.player_1) {
										game.player_1_score = score;
									} else if (playerId === match.player_2) {
										game.player_2_score = score;
									}
									game.updated_at = new Date();
									game.updated_by = userId;
								});
							},
							onMatchComplete: async (state) => {
								const playerOneWin =
									state.playerOne.currentScore > state.playerTwo.currentScore;
								const winnerId = playerOneWin ? match.player_1 : match.player_2;
								if (!match.id || !winnerId) return;
								await tournamentService.matchConfirmation.confirmWinner(
									match.id,
									winnerId,
								);
							},
						}}
						player1={{
							id: playerOne.id,
							firstName: playerOne.first_name,
							lastName: playerOne.last_name,
							gamesWon: playerOneGamesWon,
							currentScore: playerOneScore,
							matchPoint: false,
						}}
						player2={{
							id: playerTwo.id,
							firstName: playerTwo.first_name,
							lastName: playerTwo.last_name,
							gamesWon: playerTwoGamesWon,
							currentScore: playerTwoScore,
							matchPoint: false,
						}}
					/>
				</div>
			)}
			{awaitingUmpireConfirmation &&
				players &&
				players.length >= 2 &&
				match.best_of &&
				match.id && (
					<div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 w-full max-w-md shadow-lg">
						<h2 className="text-2xl font-bold mb-4 text-center">Match Ended</h2>
						<div className="text-center mb-6">
							<div className="text-xl font-semibold bg-green-100 rounded-lg py-2 px-4 inline-block">
								Table {match.table_number}
							</div>
						</div>
						<MatchScoreCard
							table={`Table ${match.table_number}`}
							umpire={`${user?.firstName} ${user?.lastName}`}
							player1={{
								id: players[0].id,
								name: `${players[0].first_name} ${players[0].last_name}`,
								division: getDivision(players[0].current_division),
								rating: 0,
								avatar: players[0].profile_image_url,
							}}
							player2={{
								id: players[1].id,
								name: `${players[1].first_name} ${players[1].last_name}`,
								division: getDivision(players[1].current_division),
								rating: 0,
								avatar: players[1].profile_image_url,
							}}
							scores={scores}
							bestOf={match.best_of}
							leagueName="MK Singles League"
							eventDate={match.startTime}
							isManuallyCreated={match.manually_created}
						/>
						<p>
							If the players are happy the above score is correct, please
							confirm and give them a chance to leave the event if they want.
							When you press the button below everyone on this table will be
							allocated a new match.
						</p>
						<Button
							className="my-4"
							onClick={() => {
								endMatchAction.executeAction(() => {
									if (!match.id)
										return Promise.reject(new Error("Match ID is required"));
									return tournamentService.matchConfirmation.confirmMatchUmpire(
										match.id,
										userId,
									);
								});
							}}
						>
							Confirm and allocate new matches
						</Button>
					</div>
				)}
		</>
	);
}
