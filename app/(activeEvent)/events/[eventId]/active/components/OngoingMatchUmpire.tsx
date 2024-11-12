import { MatchScoreCard } from "@/components/MatchScoreCard";
import Scoreboard from "@/components/scoreboard/Scoreboard";
import { Button } from "@/components/ui/button";
import { TbDeviceMobileRotated } from "react-icons/tb";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { getDivision } from "@/lib/ratingSystem";
import { tournamentService } from "@/lib/tournamentManager/hooks/useTournament";
import { client } from "@/lib/triplit";
import { useQuery, useQueryOne } from "@triplit/react";
import { useEffect } from "react";
import { fetchMatchScores } from "@/lib/matches/queries";
import { useQuery as useTSQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/hooks/useUser";
import type { TournamentMatch } from "@/lib/tournamentManager/hooks/usePlayerTournament";
import MatchStatistics from "./MatchStatistics";

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

	const showChooseServer =
		playerOneGamesWon === 0 &&
		playerTwoGamesWon === 0 &&
		currentGame?.player_1_score === 0 &&
		currentGame?.player_2_score === 0;

	const handleServerChosen = async (serverId: string) => {
		if (
			!match.id ||
			!match.player_1 ||
			!match.player_2 ||
			serverId === match.player_1
		) {
			return;
		}

		await client.update("matches", match.id, (m) => {
			const temp = m.player_1;
			m.player_1 = m.player_2;
			m.player_2 = temp;
		});
	};

	return (
		<div className="p-2 flex flex-col gap-4 items-center justify-center">
			{!awaitingUmpireConfirmation && playerOne?.id && playerTwo?.id && (
				<div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 py-20 w-full shadow-lg">
					<h2 className="text-5xl font-bold mb-4 text-center">Umpire Duty</h2>
					<div className="text-center mb-6">
						<div className="text-3xl font-semibold bg-blue-100 rounded-lg py-2 px-4 inline-block">
							Table {match.table_number}
						</div>
					</div>
					<div className="portrait:block landscape:hidden">
						<h2 className="text-center text-lg font-semibold">
							Please rotate your device to landscape mode to record scores
						</h2>
						<TbDeviceMobileRotated className="w-16 h-16 mx-auto" />
					</div>
					<div className="portrait:hidden landscape:block">
						<Scoreboard
							showSettings={false}
							persistState={false}
							showTopBar={false}
							stateProvider={{
								onGameComplete: async (state) => {
									const playerOneScore = state.playerOne.currentScore;
									const playerTwoScore = state.playerTwo.currentScore;
									if (!currentGames || currentGames.length === 0) return;
									const winner =
										playerOneScore > playerTwoScore
											? match.player_1
											: match.player_2;
									await client.update("games", currentGames[0].id, (game) => {
										try {
											const scoreHistory = JSON.parse(
												game.score_history_blob ?? "[]",
											) as {
												score: number;
												playerId: string;
												timestamp: Date;
												gameWinner: string;
											}[];
											scoreHistory.push({
												score: playerOneScore,
												playerId: match.player_1,
												timestamp: new Date(),
												gameWinner: winner,
											});
											game.score_history_blob = JSON.stringify(scoreHistory);
										} catch {
											console.error("Error parsing score history");
										}
										game.player_1_score = playerOneScore;
										game.player_2_score = playerTwoScore;
										game.updated_at = new Date();
										game.updated_by = userId;
										game.winner = winner;
									});
									await client.update("matches", match.id, (m) => {
										const oldPlayerOneScore = m.player_1_score ?? 0;
										const oldPlayerTwoScore = m.player_2_score ?? 0;
										m.player_1_score =
											winner === match.player_1
												? oldPlayerOneScore + 1
												: oldPlayerOneScore;
										m.player_2_score =
											winner === match.player_2
												? oldPlayerTwoScore + 1
												: oldPlayerTwoScore;
										m.updated_at = new Date();
										m.updated_by = userId;
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
										try {
											const scoreHistory = JSON.parse(
												game.score_history_blob ?? "[]",
											) as {
												score: number;
												playerId: string;
												timestamp: Date;
												gameWinner?: string;
											}[];
											scoreHistory.push({
												score,
												playerId,
												timestamp: new Date(),
											});
											game.score_history_blob = JSON.stringify(scoreHistory);
										} catch {
											console.error("Error parsing score history");
										}
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
									const winnerId = playerOneWin
										? match.player_1
										: match.player_2;
									if (!match.id || !winnerId) return;
									await tournamentService.matchConfirmation.confirmWinner(
										match.id,
										winnerId,
									);
								},
								onResetMatch: async () => {
									if (!currentGames || currentGames?.length === 0) return;
									await tournamentService.resetMatch(currentGames);
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
				</div>
			)}
			{awaitingUmpireConfirmation &&
				players &&
				players.length >= 2 &&
				match.best_of &&
				match.id && (
					<div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 w-full max-w-md shadow-lg">
						<h2 className="text-2xl font-bold mb-4 text-center">Match Ended</h2>
						<div className="text-center mb-6">
							<div className="text-xl font-semibold bg-blue-100 rounded-lg py-2 px-4 inline-block">
								Table {match.table_number}
							</div>
						</div>
						<MatchScoreCard
							tableNumber={match.table_number}
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
						<MatchStatistics match={match} />
						<Button
							className="w-full text-lg py-6"
							onClick={() => {
								if (!match.id) return;
								endMatchAction.executeAction(() =>
									tournamentService.matchConfirmation.confirmMatchUmpire(
										match.id,
										userId,
									),
								);
							}}
						>
							Confirm scores
						</Button>
					</div>
				)}
		</div>
	);
}
