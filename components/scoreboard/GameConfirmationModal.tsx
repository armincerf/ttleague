interface GameConfirmationModalProps {
	player1Score: number;
	player2Score: number;
	onConfirm: () => void;
	onCancel: () => void;
}

export function GameConfirmationModal({
	player1Score,
	player2Score,
	onConfirm,
	onCancel,
}: GameConfirmationModalProps) {
	const winner = player1Score > player2Score ? 1 : 2;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
				<h2 className="text-2xl font-bold mb-4">Confirm Game Winner</h2>
				<p className="mb-6">
					Player {winner} wins {player1Score}-{player2Score}. Is this correct?
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
