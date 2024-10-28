interface CorrectionButtonProps {
	correctionsMode: boolean;
	onToggle: () => void;
}

export function CorrectionButton({
	correctionsMode,
	onToggle,
}: CorrectionButtonProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={`${
				correctionsMode ? "bg-red-500" : "bg-black"
			} text-white px-4 py-3 text-lg rounded-none hover:bg-red-500 uppercase`}
		>
			{correctionsMode ? "resume game" : "correction"}
		</button>
	);
}
