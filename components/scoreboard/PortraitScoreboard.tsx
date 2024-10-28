import { AnimatePresence, motion } from "framer-motion";
import type { BaseScoreboardProps } from "./types";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard } from "./ScoreCard";

export function PortraitScoreboard({
	state,
	send,
	orderedScoreCards,
	SetCounter,
	winner = false,
}: BaseScoreboardProps) {
	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center p-4">
			<motion.div
				className="bg-black shadow-2xl w-full max-w-md"
				animate={{ scale: state.context.correctionsMode ? 0.8 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex flex-col gap-4">
					{!state.context.correctionsMode && (
						<div className="relative flex justify-between gap-2 px-4">
							<div className="text-black text-lg absolute top-0 left-0 text-center w-1/2">
								{orderedScoreCards[0].player}
							</div>
							<div className="text-black text-lg absolute top-0 right-0 text-center w-1/2">
								{orderedScoreCards[1].player}
							</div>

							<SetCounter
								count={
									state.context.sidesSwapped
										? state.context.player2GamesWon
										: state.context.player1GamesWon
								}
							/>
							<SetCounter
								count={
									state.context.sidesSwapped
										? state.context.player1GamesWon
										: state.context.player2GamesWon
								}
							/>
						</div>
					)}

					<AnimatePresence mode="popLayout">
						{orderedScoreCards.map((card) => (
							<motion.div
								key={card.indicatorColor}
								layout
								transition={{ duration: 0.5 }}
								className="w-full"
							>
								<ScoreCard
									{...card}
									correction={state.context.correctionsMode}
									showServer={!winner}
								/>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				<div className="flex justify-center mt-4">
					<CorrectionButton
						correctionsMode={state.context.correctionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
