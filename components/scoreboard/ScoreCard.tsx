import { useState, useEffect, type TouchEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ScoreDisplayProps } from "./types";
import {
	calculateCurrentServer,
	formatPlayerName,
} from "@/lib/scoreboard/utils";
import { Triangle } from "lucide-react";
import type { Player } from "@/lib/scoreboard/machine";
import { useScoreboard } from "@/lib/hooks/useScoreboard";
import { CorrectionActions } from "./CorrectionButton";

export function SetCounter({
	score,
	player,
	scoreClasses,
	containerClasses,
}: ScoreDisplayProps) {
	return (
		<div
			className={cn(
				"bg-white w-full min-w-[80px] flex flex-col items-center",
				containerClasses,
			)}
		>
			<div className="text-black text-sm">{formatPlayerName(player)}</div>
			<div className={cn("text-red-500 font-[impact]", scoreClasses)}>
				{score}
			</div>
		</div>
	);
}

export function ScoreDisplay({
	player,
	score,
	scoreClasses,
	containerClasses,
}: ScoreDisplayProps) {
	const { state } = useScoreboard();
	const context = state.context;
	const servingPlayer = calculateCurrentServer(context);
	const isServingPlayer = servingPlayer === formatPlayerName(player);
	const matchPoint =
		player.matchPoint &&
		// shouldn't need this check, but still some tricky edge cases
		context.playerOne.currentScore !== context.playerTwo.currentScore &&
		(!context.playerOne.matchPoint ||
			!context.playerTwo.matchPoint ||
			score ===
				Math.max(
					context.playerOne.currentScore,
					context.playerTwo.currentScore,
				));

	return (
		<div
			className={cn(
				"flex flex-col items-center bg-white relative",
				containerClasses,
			)}
		>
			{isServingPlayer && (
				<motion.div
					initial={{ x: -30, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ duration: 0.3, ease: "easeInOut", delay: 0.4 }}
					className="absolute top-1 left-2 z-50 flex justify-center w-8"
				>
					<Triangle className="w-8 h-8 rotate-90 text-red-500 fill-red-500" />
				</motion.div>
			)}
			<div className="w-full flex items-center justify-center text-4xl uppercase">
				{formatPlayerName(player)}
			</div>
			<div
				className={cn(
					"flex-1 flex items-center justify-center h-full font-[impact] text-9xl transition-colors",
					matchPoint ? "text-red-500" : "text-black",
					scoreClasses,
				)}
			>
				{score}
			</div>
		</div>
	);
}

const FLIP_ANIMATION_DURATION = 0.7;
const FLIP_COMPLETE_DELAY = FLIP_ANIMATION_DURATION * 700;

type ScoreCardProps = {
	player: Player;
	scoreClasses?: string;
	containerClasses?: string;
};

export function ScoreCard({
	player,
	scoreClasses,
	containerClasses,
}: ScoreCardProps) {
	const score = player.currentScore;
	const [displayScore, setDisplayScore] = useState(score);
	const [bottomScore, setBottomScore] = useState(score + 1);
	const [isFlipping, setIsFlipping] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [touchStart, setTouchStart] = useState<number>(0);
	const { state, send } = useScoreboard();
	const isCorrectionsMode = state.matches("corrections");

	useEffect(() => {
		if (isFlipping) return;
		if (score !== displayScore) {
			if (isCorrectionsMode || score < displayScore) {
				setDisplayScore(score);
				setBottomScore(score + 1);
				setIsFlipping(false);
				setIsResetting(true);
			} else {
				const timer = setTimeout(() => {
					setDisplayScore(score);
					setBottomScore(score + 1);
					setIsFlipping(false);
					setIsResetting(false);
				}, FLIP_COMPLETE_DELAY);
				return () => clearTimeout(timer);
			}
		}
	}, [score, displayScore, isCorrectionsMode, isFlipping]);

	function handleClick() {
		if (isCorrectionsMode || isFlipping) return;
		setIsFlipping(true);
		setBottomScore(score + 1);
		setTimeout(() => {
			send({ type: "INCREMENT_SCORE", playerId: player.id });
			setIsFlipping(false);
			setIsResetting(false);
			setDisplayScore(score + 1);
		}, FLIP_COMPLETE_DELAY);
	}

	function handleTouchStart(e: TouchEvent) {
		setTouchStart(e.touches[0].clientY);
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEnd = e.changedTouches[0].clientY;
		const swipeDistance = touchStart - touchEnd;

		if (Math.abs(swipeDistance) < 50) {
			handleClick();
			return;
		}

		if (swipeDistance > 50) {
			handleClick();
		} else if (swipeDistance < -50 && isCorrectionsMode) {
			send({
				type: "SET_SCORE",
				playerId: player.id,
				score: Math.max(0, score - 1),
			});
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={handleClick}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				className="w-full h-full relative cursor-pointer"
				style={{ perspective: "1000px" }}
			>
				<ScoreDisplay
					player={player}
					score={bottomScore}
					containerClasses={containerClasses}
					scoreClasses={scoreClasses}
				/>

				<motion.div
					initial={{ rotateX: 0 }}
					animate={{ rotateX: isFlipping ? 320 : 0 }}
					transition={{
						duration: isFlipping ? FLIP_ANIMATION_DURATION : 0,
						ease: "easeInOut",
					}}
					className="absolute inset-0 bg-white origin-top"
					style={{
						transformStyle: "preserve-3d",
						transition: isResetting ? "none" : undefined,
					}}
				>
					<ScoreDisplay
						player={player}
						score={displayScore}
						containerClasses={containerClasses}
						scoreClasses={scoreClasses}
					/>
				</motion.div>
			</button>

			{isCorrectionsMode && (
				<CorrectionActions
					onAdd={() =>
						send({ type: "SET_SCORE", playerId: player.id, score: score + 1 })
					}
					onSubtract={() =>
						send({
							type: "SET_SCORE",
							playerId: player.id,
							score: Math.max(0, score - 1),
						})
					}
				/>
			)}
		</div>
	);
}
