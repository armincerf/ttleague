import { AnimatePresence, motion } from "framer-motion";
import type { BaseScoreboardProps } from "./types";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard, SetCounter } from "./ScoreCard";
import {
	calculateCurrentServer,
	formatPlayerName,
} from "@/lib/scoreboard/utils";
import { useState } from "react";

export function PortraitScoreboard({
	state,
	send,
	orderedScoreCards,
	winner = false,
}: BaseScoreboardProps) {
	const [showSettings, setShowSettings] = useState(false);
	return (
		<div className="bg-black z-50 flex flex-col items-center w-screen h-screen pt-4">
			<motion.div
				className="bg-black shadow-2xl w-full max-w-md px-6"
				animate={{ scale: state.context.correctionsMode ? 0.9 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex flex-col gap-4">
					{!state.context.correctionsMode && (
						<div className="flex justify-between gap-2 px-8">
							<SetCounter
								player={
									state.context.sidesSwapped
										? orderedScoreCards[1].player
										: orderedScoreCards[0].player
								}
								score={
									state.context.sidesSwapped
										? state.context.player2GamesWon
										: state.context.player1GamesWon
								}
							/>
							<SetCounter
								player={
									state.context.sidesSwapped
										? orderedScoreCards[0].player
										: orderedScoreCards[1].player
								}
								score={
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
								/>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				<div className="flex justify-center mt-2">
					<CorrectionButton
						correctionsMode={state.context.correctionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
