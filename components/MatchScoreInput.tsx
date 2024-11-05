"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";

export interface MatchScore {
	player1Points: number;
	player2Points: number;
	isValid: boolean;
}

interface MatchScoreInputProps {
	scores: MatchScore[];
	onChange: (scores: MatchScore[]) => void;
	bestOf: number;
	player1Name: string;
	player2Name: string;
}

type ValidateScore = (p1: number, p2: number) => boolean;

const validateGameScore: ValidateScore = (p1, p2) =>
	(p1 >= 11 || p2 >= 11) && Math.abs(p1 - p2) >= 2;

const createEmptyScore = (): MatchScore => ({
	player1Points: 0,
	player2Points: 0,
	isValid: false,
});

const updateMatchScore = (
	scores: MatchScore[],
	index: number,
	player: 1 | 2,
	value: number,
): MatchScore[] => {
	const updatedScores = scores.map((score, i) =>
		i !== index
			? score
			: {
					...score,
					player1Points: player === 1 ? value : score.player1Points,
					player2Points: player === 2 ? value : score.player2Points,
				},
	);

	// Ensure score exists at index
	if (!updatedScores[index]) {
		updatedScores[index] = createEmptyScore();
	}

	// Update validity
	const currentScore = updatedScores[index];
	return updatedScores.map((score, i) =>
		i !== index
			? score
			: {
					...score,
					isValid: validateGameScore(
						currentScore.player1Points,
						currentScore.player2Points,
					),
				},
	);
};

export function MatchScoreInput({
	scores,
	onChange,
	bestOf,
	player1Name,
	player2Name,
}: MatchScoreInputProps) {
	const handleScoreUpdate = (index: number, player: 1 | 2, value: number) => {
		onChange(updateMatchScore(scores, index, player, value));
	};

	return (
		<div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
			<div className="px-4 py-2 bg-gray-50">
				<div className="flex justify-between">
					<span>Game Scores</span>
				</div>
			</div>

			<div className="bg-blue-50">
				<PlayerCard name={player1Name} />

				<div className="flex border-y border-blue-200">
					{Array.from({ length: bestOf }).map((_, index) => (
						<ScoreInputPair
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							index={index}
							score={scores[index]}
							updateScore={handleScoreUpdate}
						/>
					))}
				</div>

				<PlayerCard name={player2Name} />
			</div>
		</div>
	);
}

interface ScoreInputPairProps {
	index: number;
	score?: MatchScore;
	updateScore: (index: number, player: 1 | 2, value: number) => void;
}

function ScoreInputPair({ index, score, updateScore }: ScoreInputPairProps) {
	const p1Points = score?.player1Points ?? 0;
	const p2Points = score?.player2Points ?? 0;

	return (
		<div className="flex flex-col flex-1 border-r last:border-r-0 border-blue-200">
			<ScoreInput
				value={p1Points}
				onChange={(value) => updateScore(index, 1, value)}
				isWinning={p1Points > p2Points}
				className="border-b border-blue-200"
			/>
			<ScoreInput
				value={p2Points}
				onChange={(value) => updateScore(index, 2, value)}
				isWinning={p2Points > p1Points}
			/>
		</div>
	);
}

interface ScoreInputProps {
	value: number;
	onChange: (value: number) => void;
	isWinning: boolean;
	className?: string;
}

function ScoreInput({
	value,
	onChange,
	isWinning,
	className,
}: ScoreInputProps) {
	return (
		<Input
			type="number"
			min={0}
			value={value || ""}
			onChange={(e) => {
				const rawValue = e.target.value;
				const cleanValue = rawValue
					? Number.parseInt(rawValue.replace(/^0+/, ""), 10)
					: 0;
				onChange(cleanValue);
			}}
			className={cn(
				"text-center p-2 bg-white text-tt-blue/70",
				isWinning && "font-bold",
				className,
			)}
		/>
	);
}
