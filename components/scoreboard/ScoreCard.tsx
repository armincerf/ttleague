import { useState, useEffect, type TouchEvent } from "react";
import { motion } from "framer-motion";

const FLIP_ANIMATION_DURATION = 0.7;
const FLIP_COMPLETE_DELAY = FLIP_ANIMATION_DURATION * 700;

type ScoreCardProps = {
	score: number;
	correction: boolean;
	isPlayerOneStarting: boolean;
	setPlayerOneStarting: () => void;
	handleScoreChange: (score: number) => void;
	player: string;
	indicatorColor: string;
	showStartingPlayer: boolean;
};

export function ScoreCard({
	score,
	correction,
	isPlayerOneStarting,
	setPlayerOneStarting,
	handleScoreChange,
	player,
	indicatorColor,
	showStartingPlayer,
}: ScoreCardProps) {
	const [displayScore, setDisplayScore] = useState(score);
	const [isFlipping, setIsFlipping] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [touchStart, setTouchStart] = useState<number>(0);

	useEffect(() => {
		if (score !== displayScore) {
			// If it's a score reset (score is lower than display)
			if (score < displayScore) {
				setDisplayScore(score);
				setIsFlipping(false);
				setIsResetting(true);
			} else {
				// For normal increments, let the animation complete
				const timer = setTimeout(() => {
					setDisplayScore(score);
					setIsFlipping(false);
					setIsResetting(false);
				}, FLIP_COMPLETE_DELAY);
				return () => clearTimeout(timer);
			}
		}
	}, [score, displayScore]);

	function handleClick() {
		if (correction || isFlipping) return;
		setIsFlipping(true);
		handleScoreChange(score + 1);
	}

	function handleTouchStart(e: TouchEvent) {
		setTouchStart(e.touches[0].clientY);
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEnd = e.changedTouches[0].clientY;
		const swipeDistance = touchStart - touchEnd;

		// If it's a small movement, treat it as a tap
		if (Math.abs(swipeDistance) < 50) {
			handleClick();
			return;
		}

		// Swipe up increases score, swipe down decreases
		if (swipeDistance > 50) {
			handleClick();
		} else if (swipeDistance < -50 && correction) {
			handleScoreChange(Math.max(0, score - 1));
		}
	}

	function handleSubtractPoint() {
		handleScoreChange(Math.max(0, score - 1));
	}

	function handleAddPoint() {
		handleScoreChange(score + 1);
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={handleClick}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				className="w-full h-[290px] relative cursor-pointer"
				style={{ perspective: "1000px" }}
			>
				{showStartingPlayer && isPlayerOneStarting && (
					<div
						className={`absolute -bottom-2 left-0 right-0 h-2 ${indicatorColor}`}
					/>
				)}

				<div className="absolute inset-0 flex flex-col items-center bg-white">
					<div className="w-full flex items-center justify-center text-5xl uppercase">
						{player}
					</div>
					<div className="flex-1 flex items-center justify-center text-[12rem] h-full font-bold">
						{displayScore + 1}
					</div>
				</div>

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
					<div className="absolute inset-0 flex flex-col items-center bg-white">
						<div className="w-full flex items-center justify-center text-5xl uppercase">
							{player}
						</div>
						<div className="flex-1 flex items-center justify-center text-[12rem] font-bold">
							{displayScore}
						</div>
					</div>
				</motion.div>
			</button>
			{correction && (
				<div className="flex flex-col gap-2">
					<button
						onClick={handleAddPoint}
						className="w-full bg-red-500 py-1 uppercase text-2xl text-white"
						type="button"
					>
						add point
					</button>
					<button
						onClick={handleSubtractPoint}
						className="w-full bg-red-500 py-1 uppercase text-2xl text-white"
						type="button"
					>
						subtract point
					</button>
				</div>
			)}
		</div>
	);
}
