import { Button } from "@/components/ui/button";
import type { Match, User } from "@/triplit/schema";
import { getMatchState } from "@/lib/tournamentManager/utils/matchStateUtils";
import { useTournament } from "@/lib/tournamentManager/hooks/useTournament";
import { useState } from "react";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";
import { client } from "@/lib/triplit";

interface MatchCardProps {
	match: Match;
	player1: User;
	player2: User;
	umpire: User;
	tableNumber: number;
}

export function MatchCard({
	match,
	player1,
	player2,
	umpire,
	tableNumber,
}: MatchCardProps) {
	const matchState = getMatchState(match);
	const { service, state } = useTournament();
	const { matchConfirmation } = service;

	const initialConfirmAction = useAsyncAction({
		actionName: "Initial match confirmation",
	});

	const umpireInitialConfirmAction = useAsyncAction({
		actionName: "Initial umpire confirmation",
	});

	const winnerConfirmAction = useAsyncAction({
		actionName: "Winner confirmation",
	});

	const finalUmpireConfirmAction = useAsyncAction({
		actionName: "Final umpire confirmation",
		onSuccess: async () => {
			try {
				console.log("finalUmpireConfirmAction.onSuccess");
				if (!state?.id) throw new Error("Tournament ID is not set");
				const matchesAllTime = await client.http.fetch(
					client.query("matches").build(),
				);
				console.log("matchesAllTime", matchesAllTime);
				await service.generateNextMatch({
					tournamentId: state.id,
					matchesAllTime,
				});
				console.log("nextMatchGenerated");
			} catch (error) {
				console.error("Error generating next match:", error);
			}
		},
	});

	function formatPlayerName(player?: User) {
		return player
			? `${player.first_name} ${player.last_name}`
			: "Unknown Player";
	}

	return (
		<div className="p-4 bg-gray-50 rounded-lg space-y-4">
			<div className="flex justify-between items-center">
				<span className="font-medium">
					{formatPlayerName(player1)} vs {formatPlayerName(player2)}
				</span>
				<span className="text-sm text-gray-500">Table {tableNumber}</span>
			</div>
			<div className="text-sm text-gray-600">
				Umpire:{" "}
				{umpire ? `${umpire.first_name} ${umpire.last_name}` : "Not assigned"}
			</div>

			{matchState.needsPlayersInitialConfirmation && (
				<>
					{player1 && !match.playersConfirmed.has(player1.id) && (
						<Button
							onClick={() =>
								initialConfirmAction.executeAction(() =>
									matchConfirmation.confirmInitialMatch(match.id, player1.id),
								)
							}
							variant="secondary"
							className="w-full"
							loading={initialConfirmAction.isLoading}
						>
							Confirm Match as {formatPlayerName(player1)}
						</Button>
					)}
					{player2 && !match.playersConfirmed.has(player2.id) && (
						<Button
							onClick={() =>
								initialConfirmAction.executeAction(() =>
									matchConfirmation.confirmInitialMatch(match.id, player2.id),
								)
							}
							variant="secondary"
							className="w-full"
							loading={initialConfirmAction.isLoading}
						>
							Confirm Match as {formatPlayerName(player2)}
						</Button>
					)}
				</>
			)}

			{matchState.needsUmpireInitialConfirmation && umpire && (
				<Button
					onClick={() =>
						umpireInitialConfirmAction.executeAction(() =>
							matchConfirmation.confirmInitialMatchUmpire(
								match.id,
								umpire.id,
								match.player_1,
							),
						)
					}
					variant="secondary"
					className="w-full"
					loading={umpireInitialConfirmAction.isLoading}
				>
					Confirm Match as Umpire
				</Button>
			)}

			{matchState.needsWinnerSelection && player1 && player2 && (
				<div className="flex gap-2">
					<Button
						onClick={() =>
							winnerConfirmAction.executeAction(() =>
								matchConfirmation.confirmWinner(match.id, player1.id),
							)
						}
						variant="default"
						className="flex-1"
						loading={winnerConfirmAction.isLoading}
					>
						{formatPlayerName(player1)} Won
					</Button>
					<Button
						onClick={() =>
							winnerConfirmAction.executeAction(() =>
								matchConfirmation.confirmWinner(match.id, player2.id),
							)
						}
						variant="default"
						className="flex-1"
						loading={winnerConfirmAction.isLoading}
					>
						{formatPlayerName(player2)} Won
					</Button>
				</div>
			)}

			{matchState.needsUmpireConfirmation && umpire && (
				<Button
					disabled={!state?.id}
					loading={finalUmpireConfirmAction.isLoading}
					onClick={() =>
						finalUmpireConfirmAction.executeAction(() =>
							matchConfirmation.confirmMatchUmpire(match.id, umpire.id),
						)
					}
					variant="secondary"
					className="w-full"
				>
					Confirm Winner as Umpire
				</Button>
			)}
		</div>
	);
}
