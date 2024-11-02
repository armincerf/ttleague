import { Button } from "@/components/ui/button";
import type { Match, User } from "@/triplit/schema";
import { getMatchState } from "@/lib/tournamentManager/utils/matchStateUtils";
import { useTournament } from "@/lib/tournamentManager/hooks/useTournament";
import { useState } from "react";
import { useAsyncAction } from "@/lib/hooks/useAsyncAction";

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
				if (!state?.id) throw new Error("Tournament ID is not set");
				await service.generateNextMatch(state.id);
			} catch (error) {
				console.error("Error generating next match:", error);
			}
		},
	});

	return (
		<div className="p-4 bg-gray-50 rounded-lg space-y-4">
			<div className="flex justify-between items-center">
				<span className="font-medium">
					{player1.first_name} {player1.last_name} vs {player2.first_name}{" "}
					{player2.last_name}
				</span>
				<span className="text-sm text-gray-500">Table {tableNumber}</span>
			</div>
			<div className="text-sm text-gray-600">
				Umpire: {umpire.first_name} {umpire.last_name}
			</div>

			{matchState.needsPlayersInitialConfirmation && (
				<>
					{!match.playersConfirmed.has(player1.id) && (
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
							Confirm Match as {player1.first_name} {player1.last_name}
						</Button>
					)}
					{!match.playersConfirmed.has(player2.id) && (
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
							Confirm Match as {player2.first_name} {player2.last_name}
						</Button>
					)}
				</>
			)}

			{matchState.needsUmpireInitialConfirmation && (
				<Button
					onClick={() =>
						umpireInitialConfirmAction.executeAction(() =>
							matchConfirmation.confirmInitialMatchUmpire(match.id, umpire.id),
						)
					}
					variant="secondary"
					className="w-full"
					loading={umpireInitialConfirmAction.isLoading}
				>
					Confirm Match as Umpire
				</Button>
			)}

			{matchState.needsWinnerSelection && (
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
						{player1.first_name} {player1.last_name} Won
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
						{player2.first_name} {player2.last_name} Won
					</Button>
				</div>
			)}

			{matchState.needsUmpireConfirmation && (
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
