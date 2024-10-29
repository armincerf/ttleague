import { AnimatePresence, motion } from "framer-motion";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard, SetCounter } from "./ScoreCard";
import type { LandscapeOrPortraitScoreboardProps } from "@/lib/scoreboard/types";

export function PortraitScoreboard({
	state,
	send,
	player1,
	player2,
}: LandscapeOrPortraitScoreboardProps) {
	const { sidesSwapped } = state.context;
	const [topPlayer, topScore, bottomPlayer, bottomScore] = sidesSwapped
		? [player2, state.context.playerTwo, player1, state.context.playerOne]
		: [player1, state.context.playerOne, player2, state.context.playerTwo];

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
								player={topPlayer}
								score={topScore.gamesWon}
								containerClasses="w-24"
							/>
							<SetCounter
								player={bottomPlayer}
								score={bottomScore.gamesWon}
								containerClasses="w-24"
							/>
						</div>
					)}

					<AnimatePresence mode="popLayout">
						<motion.div
							key="top-player"
							layout
							transition={{ duration: 0.5 }}
							className="w-full"
						>
							<ScoreCard
								player={topPlayer}
								score={topScore.currentScore}
								handleScoreChange={(score) =>
									send({
										type: "SET_SCORE",
										playerId: sidesSwapped ? "player2" : "player1",
										score,
									})
								}
								correction={state.context.correctionsMode}
							/>
						</motion.div>

						<motion.div
							key="bottom-player"
							layout
							transition={{ duration: 0.5 }}
							className="w-full"
						>
							<ScoreCard
								player={bottomPlayer}
								score={bottomScore.currentScore}
								handleScoreChange={(score) =>
									send({
										type: "SET_SCORE",
										playerId: sidesSwapped ? "player1" : "player2",
										score,
									})
								}
								correction={state.context.correctionsMode}
							/>
						</motion.div>
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
