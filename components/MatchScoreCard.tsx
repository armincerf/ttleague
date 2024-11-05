import { cn } from "@/lib/utils";
import Image from "next/image";
interface Player {
	id: string;
	name: string;
	division: string;
	rating: number;
	avatar?: string;
}

export interface MatchScore {
	player1Points: number;
	player2Points: number;
	completedAt?: Date;
	startedAt?: Date;
	isValid: boolean;
}

interface MatchProps {
	player1: Player;
	player2: Player;
	scores: MatchScore[];
	isSubmitted?: boolean;
	isCertified?: boolean;
	isCarriedOver?: boolean;
	isCanceled?: boolean;
	umpire?: string;
	table?: string;
	bestOf: number;
}

interface PlayerCardProps {
	player: Player;
}

function PlayerCard({ player }: PlayerCardProps) {
	return (
		<div className="bg-white rounded-lg px-2 py-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-row items-center space-x-2">
					<div className="font-semibold">{player.name}</div>
					<div className="text-sm text-gray-600">{player.division}</div>
				</div>
				{player.avatar && (
					<Image src={player.avatar} alt={player.name} width={20} height={20} />
				)}
			</div>
		</div>
	);
}

function createEmptyScore(): MatchScore {
	return {
		player1Points: 0,
		player2Points: 0,
		isValid: false,
	};
}

export function MatchScoreCard({
	player1,
	player2,
	scores,
	bestOf,
	isSubmitted,
	isCertified,
	isCarriedOver,
	isCanceled,
	umpire,
	table,
}: MatchProps) {
	const gamesNeededToWin = Math.ceil(bestOf / 2);
	const paddedScores = [
		...scores,
		...Array(bestOf - scores.length)
			.fill(0)
			.map(createEmptyScore),
	];
	console.log(paddedScores);

	const totalGamesWon = paddedScores.reduce(
		(acc, score) => {
			if (score.completedAt && score.isValid) {
				return {
					player1:
						acc.player1 + (score.player1Points > score.player2Points ? 1 : 0),
					player2:
						acc.player2 + (score.player2Points > score.player1Points ? 1 : 0),
				};
			}
			return acc;
		},
		{ player1: 0, player2: 0 },
	);

	const matchIsComplete =
		totalGamesWon.player1 >= gamesNeededToWin ||
		totalGamesWon.player2 >= gamesNeededToWin;

	return (
		<div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden my-4">
			{/* Match Info Header - restructured to match example */}
			<div className="px-4 py-2 bg-gray-50">
				<div className="flex justify-between">
					<div className="flex items-center space-x-4">
						<span className="MatchDescription">Match</span>
						{umpire && (
							<span className="MatchInfo-umpire">Umpire: {umpire}</span>
						)}
					</div>
					{table && <div>{table}</div>}
				</div>
			</div>

			<div className="bg-blue-50">
				<PlayerCard player={player1} />
				<div className="flex border-y border-blue-200">
					{/* Games Score */}
					<div className="flex flex-1 flex-col border-r border-blue-200 text-white font-bold max-w-16">
						<div
							className={cn(
								"text-center flex flex-col flex-1 justify-center items-center border-b border-blue-200",
								totalGamesWon.player1 > totalGamesWon.player2
									? "bg-tt-blue "
									: "bg-tt-blue/60",
							)}
						>
							{totalGamesWon.player1}
						</div>
						<div
							className={cn(
								"text-center flex flex-col flex-1 justify-center items-center",
								totalGamesWon.player1 > totalGamesWon.player2
									? "bg-tt-blue/40"
									: "bg-tt-blue",
							)}
						>
							{totalGamesWon.player2}
						</div>
					</div>

					{/* Game Points */}
					<div className="flex flex-1">
						{paddedScores.map((score, index) => (
							<div
								key={`score-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									index
								}`}
								className="flex flex-col flex-1 border-r last:border-r-0 border-blue-200"
							>
								<div
									className={cn(
										"text-center p-2 bg-white text-tt-blue/70 border-b border-blue-200",
										score.player1Points > score.player2Points && "font-bold",
									)}
								>
									{score.startedAt ? score.player1Points : "-"}
								</div>
								<div
									className={cn(
										"text-center p-2 bg-white text-tt-blue/70",
										score.player2Points > score.player1Points && "font-bold",
									)}
								>
									{score.startedAt ? score.player2Points : "-"}
								</div>
							</div>
						))}
					</div>
				</div>

				<PlayerCard player={player2} />
			</div>

			{/* Optional: Add match completion status */}
			{matchIsComplete && (
				<div className="px-4 py-2 bg-green-50 text-sm text-green-700">
					Winner:{" "}
					{totalGamesWon.player1 > totalGamesWon.player2
						? player1.name
						: player2.name}
				</div>
			)}

			{/* Match Status */}
			{(isSubmitted || isCertified || isCarriedOver || isCanceled) && (
				<div className="px-4 py-2 bg-gray-50 text-sm">
					<div className="flex space-x-2">
						{isSubmitted && <span className="text-green-600">Submitted</span>}
						{isCertified && <span className="text-blue-600">Certified</span>}
						{isCarriedOver && (
							<span className="text-yellow-600">Carried Over</span>
						)}
						{isCanceled && <span className="text-red-600">Canceled</span>}
					</div>
				</div>
			)}
		</div>
	);
}
