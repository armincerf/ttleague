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
	const isCorrectionsMode = state.matches("corrections");

	const scoreboardItems = [
		{
			id: "setCounters",
			order: 0,
			component: !isCorrectionsMode && (
				<div className="flex justify-between gap-2 px-8">
					<SetCounter
						player={sidesSwapped ? player2 : player1}
						score={
							sidesSwapped
								? state.context.playerTwo.gamesWon
								: state.context.playerOne.gamesWon
						}
						containerClasses="w-24"
					/>
					<SetCounter
						player={sidesSwapped ? player1 : player2}
						score={
							sidesSwapped
								? state.context.playerOne.gamesWon
								: state.context.playerTwo.gamesWon
						}
						containerClasses="w-24"
					/>
				</div>
			),
		},
		{
			id: "player1Score",
			order: sidesSwapped ? 2 : 1,
			component: <ScoreCard player={player1} />,
		},
		{
			id: "player2Score",
			order: sidesSwapped ? 1 : 2,
			component: <ScoreCard player={player2} />,
		},
	].sort((a, b) => a.order - b.order);

	return (
		<div className="bg-black z-50 flex flex-col items-center w-screen h-screen pt-4">
			<motion.div
				className="bg-black shadow-2xl w-full max-w-md px-6"
				animate={{ scale: isCorrectionsMode ? 0.9 : 1 }}
				transition={{ duration: 0.2 }}
			>
				<div className="flex flex-col gap-4">
					<AnimatePresence mode="popLayout" initial={false}>
						{scoreboardItems.map(
							({ id, component }) =>
								component && (
									<motion.div
										key={id}
										layout
										initial={false}
										animate={{ opacity: 1 }}
										transition={{
											type: "spring",
											bounce: 0.2,
											duration: 0.6,
										}}
										className="w-full"
									>
										{component}
									</motion.div>
								),
						)}
					</AnimatePresence>
				</div>

				<div className="flex justify-center mt-2">
					<CorrectionButton
						correctionsMode={isCorrectionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
						onReset={() => {
							send({ type: "SET_SCORE", playerId: "player1", score: 0 });
							send({ type: "SET_SCORE", playerId: "player2", score: 0 });
						}}
						onResetMatch={() => send({ type: "RESET_MATCH" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
