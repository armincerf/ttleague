import { AnimatePresence, motion } from "framer-motion";
import type { BaseScoreboardProps } from "./types";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard } from "./ScoreCard";

export function LandscapeScoreboard({
	state,
	send,
	orderedScoreCards,
	SetCounter,
	winner = false,
}: BaseScoreboardProps) {
	return (
		<div className="fixed inset-0 p-12 bg-black z-50 flex flex-col justify-center items-center">
			<motion.div
				className="bg-black p-2 shadow-2xl w-full"
				animate={{ scale: state.context.correctionsMode ? 0.8 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex justify-between items-start mb-4 gap-2">
					<div className="w-[15%]">
						<SetCounter
							count={
								state.context.sidesSwapped
									? state.context.player2GamesWon
									: state.context.player1GamesWon
							}
						/>
					</div>
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
									correction={state.context.correctionsMode}
									showServer={!winner}
								/>
							</motion.div>
						))}
					</AnimatePresence>
					<div className="w-[15%]">
						<SetCounter
							count={
								state.context.sidesSwapped
									? state.context.player1GamesWon
									: state.context.player2GamesWon
							}
						/>
					</div>
				</div>
				<div className="flex justify-center items-end">
					<CorrectionButton
						correctionsMode={state.context.correctionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
