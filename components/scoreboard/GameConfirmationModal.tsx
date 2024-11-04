import type { Player } from "@/lib/scoreboard/machine";
import { formatPlayerName } from "@/lib/scoreboard/utils";

interface GameConfirmationModalProps {
	player1: Player;
	player2: Player;
	onConfirm: () => void;
	onCancel: () => void;
}

export function GameConfirmationModal({
	player1,
	player2,
	onConfirm,
	onCancel,
}: GameConfirmationModalProps) {
	const player1Score = player1.currentScore;
	const player2Score = player2.currentScore;
	const winner = player1Score > player2Score ? player1 : player2;
	const winnerScore = winner.currentScore;
	const loser = winner === player1 ? player2 : player1;
	const loserScore = loser.currentScore;
	const winnerName = formatPlayerName(winner);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 sm:mx-0">
				<h2 className="text-2xl font-bold mb-4">Confirm Game Winner</h2>
				<p className="mb-6">
					{winnerName} wins {winnerScore}-{loserScore}. Is this correct?
				</p>
				<div className="flex gap-4 justify-end">
					<button
						onClick={onCancel}
						className="px-4 py-2 border border-gray-300 rounded"
						type="button"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-green-500 text-white rounded"
						type="button"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
