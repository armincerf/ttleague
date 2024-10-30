interface CorrectionButtonProps {
	correctionsMode: boolean;
	onToggle: () => void;
	onReset: () => void;
	onResetMatch: () => void;
}

export function CorrectionButton({
	correctionsMode,
	onToggle,
	onReset,
	onResetMatch,
}: CorrectionButtonProps) {
	return (
		<>
			{correctionsMode ? (
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={onToggle}
						className="bg-green-200 border border-slate-200 text-slate-900 px-4 py-3 text-lg rounded-none hover:bg-red-600 uppercase"
					>
						resume game
					</button>
					<button
						type="button"
						onClick={onReset}
						className="bg-red-500 text-white px-4 py-3 text-lg rounded-none hover:bg-red-600 uppercase"
					>
						reset game
					</button>
					<button
						type="button"
						onClick={onResetMatch}
						className="bg-red-500 text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase"
					>
						reset match
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={onToggle}
					className="bg-black text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase"
				>
					correction
				</button>
			)}
		</>
	);
}

type CorrectionActionsProps = {
	onAdd: () => void;
	onSubtract: () => void;
};

export function CorrectionActions({
	onAdd,
	onSubtract,
}: CorrectionActionsProps) {
	return (
		<div className="flex flex-col gap-2">
			<button
				onClick={onAdd}
				className="w-full bg-red-500 py-1 uppercase text-2xl text-white z-50"
				type="button"
			>
				add point
			</button>
			<button
				onClick={onSubtract}
				className="w-full bg-red-500 py-1 uppercase text-2xl text-white z-50"
				type="button"
			>
				subtract point
			</button>
		</div>
	);
}
