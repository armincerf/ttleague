import { motion } from "framer-motion";
import { CorrectionButton } from "./CorrectionButton";
import { ScoreCard, SetCounter } from "./ScoreCard";
import type { LandscapeOrPortraitScoreboardProps } from "@/lib/scoreboard/types";
import { cn } from "@/lib/utils";

export function LandscapeScoreboard({
	state,
	send,
	player1,
	player2,
}: LandscapeOrPortraitScoreboardProps) {
	const { sidesSwapped } = state.context;
	const [leftPlayer, leftScore, rightPlayer, rightScore] = sidesSwapped
		? [player2, state.context.playerTwo, player1, state.context.playerOne]
		: [player1, state.context.playerOne, player2, state.context.playerTwo];

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center w-full h-full">
			<motion.div
				className="bg-black p-2 shadow-2xl w-full h-full"
				animate={{ scale: state.context.correctionsMode ? 0.8 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex justify-between items-start mb-4 gap-2 h-[75%]">
					<SetCounter
						player={leftPlayer}
						score={leftScore.gamesWon}
						containerClasses="w-[12%]"
						scoreClasses="text-[6.5rem] leading-none"
					/>

					<div className="w-[35%]">
						<ScoreCard
							player={leftPlayer}
							score={leftScore.currentScore}
							handleScoreChange={(score) =>
								send({
									type: "SET_SCORE",
									playerId: sidesSwapped ? "player2" : "player1",
									score,
								})
							}
							scoreClasses="text-[20vw]"
							correction={state.context.correctionsMode}
						/>
					</div>

					<div className="w-[35%]">
						<ScoreCard
							player={rightPlayer}
							score={rightScore.currentScore}
							handleScoreChange={(score) =>
								send({
									type: "SET_SCORE",
									playerId: sidesSwapped ? "player1" : "player2",
									score,
								})
							}
							scoreClasses="text-[20vw]"
							correction={state.context.correctionsMode}
						/>
					</div>

					<SetCounter
						player={rightPlayer}
						score={rightScore.gamesWon}
						containerClasses="w-[12%]"
						scoreClasses="text-[6.5rem] leading-none"
					/>
				</div>

				<div
					className={cn(
						state.context.correctionsMode
							? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-3"
							: "flex justify-center items-end pt-3",
					)}
				>
					<CorrectionButton
						correctionsMode={state.context.correctionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
