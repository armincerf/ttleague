import type { Match } from "@/lib/tournamentManager/types";
import { Button } from "@/components/ui/button";

interface MatchCardProps {
	match: Match;
	tableNumber: number;
	onConfirmWinner: (matchId: string, winnerId: string) => void;
	onConfirmMatch: (matchId: string, playerId: string) => void;
}

export function MatchCard({
	match,
	tableNumber,
	onConfirmWinner,
	onConfirmMatch,
}: MatchCardProps) {
	const needsWinnerSelection = match.state === "ongoing" && !match.winnerId;
	const needsUmpireConfirmation =
		match.state === "ongoing" && match.winnerId && !match.umpireConfirmed;
	const needsPlayerConfirmation =
		match.state === "ongoing" && match.winnerId && match.umpireConfirmed;

	return (
		<div className="p-4 bg-gray-50 rounded-lg space-y-4">
			<div className="flex justify-between items-center">
				<span className="font-medium">
					{match.player1.name} vs {match.player2.name}
				</span>
				<span className="text-sm text-gray-500">Table {tableNumber}</span>
			</div>
			<div className="text-sm text-gray-600">Umpire: {match.umpire.name}</div>

			{needsWinnerSelection && (
				<div className="flex gap-2">
					<Button
						onClick={() => onConfirmWinner(match.id, match.player1.id)}
						variant="default"
						className="flex-1"
					>
						{match.player1.name} Won
					</Button>
					<Button
						onClick={() => onConfirmWinner(match.id, match.player2.id)}
						variant="default"
						className="flex-1"
					>
						{match.player2.name} Won
					</Button>
				</div>
			)}

			{needsUmpireConfirmation && (
				<Button
					onClick={() => onConfirmMatch(match.id, match.umpire.id)}
					variant="secondary"
					className="w-full"
				>
					Confirm as Umpire
				</Button>
			)}

			{needsPlayerConfirmation && (
				<div className="space-y-2">
					{!match.playersConfirmed.has(match.player1.id) && (
						<Button
							onClick={() => onConfirmMatch(match.id, match.player1.id)}
							variant="outline"
							className="w-full"
						>
							Confirm as {match.player1.name}
						</Button>
					)}
					{!match.playersConfirmed.has(match.player2.id) && (
						<Button
							onClick={() => onConfirmMatch(match.id, match.player2.id)}
							variant="outline"
							className="w-full"
						>
							Confirm as {match.player2.name}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
