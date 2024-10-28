import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ScoreCardProps {
	score: number;
	correction: boolean;
	serveTurn: boolean;
	setServeTurn: () => void;
	handleScoreChange: (score: number) => void;
	player: string;
	indicatorColor: string; // Add this new prop
	showServer: boolean;
}

const FLIP_ANIMATION_DURATION = 0.7;
const FLIP_COMPLETE_DELAY = FLIP_ANIMATION_DURATION * 700;

export function ScoreCard({
	score,
	correction,
	serveTurn,
	setServeTurn,
	handleScoreChange,
	player,
	indicatorColor,
	showServer,
}: ScoreCardProps) {
	const [displayScore, setDisplayScore] = useState(score);
	const [isFlipping, setIsFlipping] = useState(false);
	const [isResetting, setIsResetting] = useState(false);

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

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={handleClick}
				className="w-full h-[290px] relative cursor-pointer"
				style={{ perspective: "1000px" }}
			>
				{showServer && serveTurn && (
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
						onClick={() => handleScoreChange(score + 1)}
						className="w-full bg-red-500 py-1 uppercase text-2xl text-white"
						type="button"
					>
						add point
					</button>
					<button
						onClick={() => handleScoreChange(Math.max(0, score - 1))}
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
