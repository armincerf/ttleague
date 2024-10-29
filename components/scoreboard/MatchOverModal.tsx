import type { Player } from "@/lib/scoreboard/machine";
import { formatPlayerName } from "@/lib/scoreboard/utils";
interface MatchOverModalProps {
	player1: Player;
	player2: Player;
	onClose: () => void;
}

export function MatchOverModal({
	player1,
	player2,
	onClose,
}: MatchOverModalProps) {
	const winner = player1.gamesWon > player2.gamesWon ? player1 : player2;
	const winnerScore = winner.gamesWon;
	const loser = winner === player1 ? player2 : player1;
	const loserScore = loser.gamesWon;
	const winnerName = formatPlayerName(winner);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-2xl font-bold mb-4">Match Complete!</h2>
				<p className="mb-6">
					{winnerName} wins the match {winnerScore}-{loserScore}!
				</p>
				<div className="flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-blue-500 text-white rounded"
						type="button"
					>
						New Match
					</button>
				</div>
			</div>
		</div>
	);
}
