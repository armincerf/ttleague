import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

type Player = {
	id: string;
	first_name: string;
	last_name: string;
};

type ChooseServerProps = {
	player1: Player;
	player2: Player;
	initialServerChosen: boolean;
	onServerChosen: (serverId: string) => void;
};

export function ChooseServer({
	player1,
	player2,
	initialServerChosen,
	onServerChosen,
}: ChooseServerProps) {
	const [isAnimating, setIsAnimating] = useState(false);
	const [players, setPlayers] = useState([player1, player2]);
	const [serverChosen, setServerChosen] = useState(initialServerChosen);

	function handleRandomChoice() {
		setServerChosen(true);
		setIsAnimating(true);
		const startTime = Date.now();
		const duration = 2500;
		const intervalTime = 300;

		const chosenPlayer = Math.random() < 0.5 ? player1 : player2;

		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime;

			if (elapsed >= duration) {
				clearInterval(interval);
				setPlayers([
					chosenPlayer,
					chosenPlayer === player1 ? player2 : player1,
				]);
				setTimeout(() => {
					setIsAnimating(false);
					onServerChosen(chosenPlayer.id);
				}, 250);
			} else {
				setPlayers((current) => [current[1], current[0]]);
			}
		}, intervalTime);
	}

	return (
		<div className="relative bg-blue-50 border-2 border-blue-300 rounded-xl p-6 w-full max-w-md shadow-lg">
			<h2 className="text-2xl font-bold mb-4 text-center">Choose Server</h2>
			<p className="text-gray-600 mb-6 text-center">
				Select which player will serve first
			</p>
			<div className="relative gap-4 flex h-[140px]">
				{players.map((player, index) => (
					<motion.button
						key={player.id}
						type="button"
						onClick={() => {
							setServerChosen(true);
							onServerChosen(player.id);
							const shouldSwap = index === 1;
							if (shouldSwap) {
								setIsAnimating(true);
								setTimeout(() => {
									setPlayers([
										shouldSwap ? players[1] : players[0],
										shouldSwap ? players[0] : players[1],
									]);
									setIsAnimating(false);
								}, 250);
							}
						}}
						disabled={isAnimating}
						className={cn(
							"absolute w-full",
							"p-4 text-lg font-semibold border-2 border-blue-200 rounded-lg transition-colors disabled:opacity-50",
							index === 0 && serverChosen ? "bg-blue-200" : "bg-transparent",
							isAnimating && "animate-pulse",
						)}
						animate={{
							y: index * 80,
						}}
						transition={{ duration: 0.3 }}
					>
						{player.first_name} {player.last_name}
					</motion.button>
				))}
			</div>
			<button
				type="button"
				onClick={handleRandomChoice}
				disabled={isAnimating}
				className="mt-4 p-3 text-md font-semibold bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 w-full"
			>
				Pick Random
			</button>
		</div>
	);
}
