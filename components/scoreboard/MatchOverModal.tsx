interface MatchOverModalProps {
	player1GamesWon: number;
	player2GamesWon: number;
	onClose: () => void;
}

export function MatchOverModal({
	player1GamesWon,
	player2GamesWon,
	onClose,
}: MatchOverModalProps) {
	const winner = player1GamesWon > player2GamesWon ? 1 : 2;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-2xl font-bold mb-4">Match Complete!</h2>
				<p className="mb-6">
					Player {winner} wins the match {player1GamesWon}-{player2GamesWon}!
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
