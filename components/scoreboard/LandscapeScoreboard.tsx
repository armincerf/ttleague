import { AnimatePresence, motion } from "framer-motion";
import type { BaseScoreboardProps, ScoreDisplayProps } from "./types";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard, SetCounter } from "./ScoreCard";

export function LandscapeScoreboard({
	state,
	send,
	orderedScoreCards,
	winner = false,
}: BaseScoreboardProps) {
	function getSetCounterProps(index: 0 | 1) {
		const isSwapped = state.context.sidesSwapped;
		const playerIndex = isSwapped ? 1 - index : index;
		return {
			containerClasses: "w-[12%]",
			scoreClasses: "text-[6.5rem] leading-none",
			player: orderedScoreCards[playerIndex].player,
			score:
				playerIndex === 0
					? state.context.player1GamesWon
					: state.context.player2GamesWon,
		} satisfies ScoreDisplayProps;
	}

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center w-full h-full">
			<motion.div
				className="bg-black p-2 shadow-2xl w-full h-full"
				animate={{ scale: state.context.correctionsMode ? 0.8 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex justify-between items-start mb-4 gap-2 h-[75%]">
					<SetCounter {...getSetCounterProps(0)} />
					<AnimatePresence mode="popLayout">
						{orderedScoreCards.map((card) => (
							<motion.div
								key={card.indicatorColor}
								className="w-[35%]"
								layout
								transition={{ duration: 0.5 }}
							>
								<ScoreCard
									{...card}
									scoreClasses="text-[20vw]"
									correction={state.context.correctionsMode}
								/>
							</motion.div>
						))}
					</AnimatePresence>
					<SetCounter {...getSetCounterProps(1)} />
				</div>
				<div className="flex justify-center items-end pt-3">
					<CorrectionButton
						correctionsMode={state.context.correctionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
