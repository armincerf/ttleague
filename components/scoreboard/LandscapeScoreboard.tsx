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
	const isCorrectionsMode = state.matches("corrections");

	const scoreboardItems = [
		{
			id: "player1Counter",
			order: sidesSwapped ? 3 : 0,
			className: "w-[12%]",
			component: (
				<SetCounter
					player={player1}
					score={state.context.playerOne.gamesWon}
					scoreClasses="text-[6.5rem] leading-none"
				/>
			),
		},
		{
			id: "player1Score",
			order: sidesSwapped ? 2 : 1,
			className: "w-[35%]",
			component: <ScoreCard player={player1} scoreClasses="text-[20vw]" />,
		},
		{
			id: "player2Score",
			order: sidesSwapped ? 1 : 2,
			className: "w-[35%]",
			component: <ScoreCard player={player2} scoreClasses="text-[20vw]" />,
		},
		{
			id: "player2Counter",
			order: sidesSwapped ? 0 : 3,
			className: "w-[12%]",
			component: (
				<SetCounter
					player={player2}
					score={state.context.playerTwo.gamesWon}
					scoreClasses="text-[6.5rem] leading-none"
				/>
			),
		},
	].sort((a, b) => a.order - b.order);

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center w-full">
			<motion.div
				className="bg-black p-2 shadow-2xl w-full h-full"
				animate={{
					scale: isCorrectionsMode ? 0.8 : 1,
					translateY: isCorrectionsMode ? -30 : 0,
				}}
				transition={{ duration: 0.2 }}
			>
				<div className="flex justify-between items-start mb-4 gap-2 h-[75%] ">
					{scoreboardItems.map(({ id, component, className }) => (
						<div key={id} className={className}>
							{component}
						</div>
					))}
				</div>

				<div
					className={cn(
						isCorrectionsMode
							? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-3 z-50 border-2 bg-white p-4 rounded-lg"
							: "flex justify-start ",
					)}
				>
					<CorrectionButton
						correctionsMode={isCorrectionsMode}
						onToggle={() => send({ type: "TOGGLE_CORRECTIONS_MODE" })}
						onReset={() => {
							console.log("reset game");
							send({ type: "SET_SCORE", playerId: player1.id, score: 0 });
							send({ type: "SET_SCORE", playerId: player2.id, score: 0 });
						}}
						onResetMatch={() => send({ type: "RESET_MATCH" })}
					/>
				</div>
			</motion.div>
		</div>
	);
}
