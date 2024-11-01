"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/triplit";
import type { Match, User, Game } from "@/triplit/schema";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getGameNumber } from "./utils";

const schema = z.object({
	player1Score: z.number().min(0),
	player2Score: z.number().min(0),
});

function RecordScoreForm({
	match,
	fullscreen,
}: {
	match: Match & {
		player1?: User | null;
		player2?: User | null;
		games?: Game[];
	};
	fullscreen?: boolean;
}) {
	const [gameId, setGameId] = useState<string>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentGame = gameId
		? match.games?.find((game) => game.id === gameId)
		: null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!gameId || !currentGame) return;

		setIsSubmitting(true);
		try {
			const now = new Date();
			const tx = await client.update("games", gameId, (game) => {
				game.completed_at = now;
				game.last_edited_at = now;
			});

			if (tx.txId) {
				client.syncEngine.onTxCommit(tx.txId, () => {
					setGameId(undefined);
				});
				client.syncEngine.onTxFailure(tx.txId, (error) => {
					console.error("Error submitting score:", error);
					toast({
						title: "Error submitting score",
						description:
							"You may have poor internet connection. The app will try again in the background but best to take a screenshot just in case",
					});
				});
			}
		} catch (error) {
			console.error("Error submitting score:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// New function to handle score changes
	const handleScoreChange = async (
		fieldName: "player1Score" | "player2Score",
		newValue: number,
	) => {
		const now = new Date();
		const gameNumber = getGameNumber(match.games ?? []);
		const id = `${match.id}-${gameNumber}`;
		const potentialGameId = `game-${id}`;
		if (!gameId) {
			const existingGame = await client.fetchById("games", potentialGameId, {
				policy: "local-only",
			});
			if (existingGame) {
				setGameId(existingGame.id);
			}
		}

		if (!gameId) {
			// Create new game on first score
			const newGameId = `game-${match.id}-${gameNumber - 1}`;

			await client.insert("games", {
				id: newGameId,
				match_id: match.id,
				player_1_score: fieldName === "player1Score" ? newValue : 0,
				player_2_score: fieldName === "player2Score" ? newValue : 0,
				started_at: now,
				last_edited_at: now,
				game_number: gameNumber,
			});

			setGameId(newGameId);
		} else {
			await client.update("games", gameId, (game) => {
				if (fieldName === "player1Score") {
					game.player_1_score = newValue;
				} else {
					game.player_2_score = newValue;
				}
				game.last_edited_at = now;
			});
		}
	};

	function isValidScore(score1: number, score2: number) {
		const maxScore = Math.max(score1, score2);
		const minScore = Math.min(score1, score2);
		return maxScore >= 11 && maxScore - minScore >= 2;
	}

	function CustomScoreInput({
		value,
		onChange,
		onIncrement,
		onDecrement,
		inputProps,
	}: {
		value: number;
		onChange: (value: number) => void;
		onIncrement: () => void;
		onDecrement: () => void;
		inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
	}) {
		return (
			<div className="flex flex-col items-center">
				<Button
					type="button"
					onClick={onIncrement}
					className="p-2 w-full"
					variant="ghost"
				>
					<ChevronUp className="h-6 w-6" />
				</Button>
				<Input
					type="number"
					value={value}
					onChange={(e) => onChange(Number(e.target.value) || 0)}
					min={0}
					className="text-4xl h-16 text-center w-24 bg-blue-100"
					{...inputProps}
				/>
				<Button
					type="button"
					onClick={onDecrement}
					className="p-2 w-full"
					variant="ghost"
				>
					<ChevronDown className="h-6 w-6" />
				</Button>
			</div>
		);
	}

	function ScoreInput({
		player,
		fieldName,
	}: {
		player: User;
		fieldName: "player1Score" | "player2Score";
	}) {
		const score =
			fieldName === "player1Score"
				? (currentGame?.player_1_score ?? 0)
				: (currentGame?.player_2_score ?? 0);

		return (
			<div className="flex-1">
				<div className="flex justify-center gap-2 relative">
					<CustomScoreInput
						value={score}
						onChange={(value) => void handleScoreChange(fieldName, value)}
						onIncrement={() => void handleScoreChange(fieldName, score + 1)}
						onDecrement={() =>
							void handleScoreChange(fieldName, Math.max(0, score - 1))
						}
						inputProps={{
							id: `${player.id}-${fieldName}`,
						}}
					/>
					<Button
						type="button"
						variant="outline"
						onClick={() => void handleScoreChange(fieldName, 11)}
						className="h-8 px-4 absolute right-[-1rem] top-[1.5rem]"
					>
						11
					</Button>
				</div>
				<label
					className="block mb-2 text-center"
					htmlFor={`${player.id}-${fieldName}`}
				>
					{player.first_name} {player.last_name}
				</label>
			</div>
		);
	}

	if (!match.player1 || !match.player2) return null;

	return (
		<form
			onSubmit={handleSubmit}
			className={`${
				fullscreen
					? "fixed inset-0 bg-background z-50 flex flex-col justify-center items-center p-4"
					: "mt-6"
			}`}
		>
			{fullscreen && (
				<div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
					Rotate to portrait to submit score
				</div>
			)}
			<div
				className={`flex gap-4 mb-4 ${fullscreen ? "scale-150 gap-40" : ""}`}
			>
				<ScoreInput player={match.player1} fieldName="player1Score" />
				<ScoreInput player={match.player2} fieldName="player2Score" />
			</div>
			{!fullscreen && (
				<Button
					type="submit"
					disabled={
						!currentGame ||
						isSubmitting ||
						!isValidScore(
							currentGame.player_1_score,
							currentGame.player_2_score,
						)
					}
					className="w-full"
				>
					{isSubmitting ? "Submitting..." : "Submit Score"}
				</Button>
			)}
		</form>
	);
}

export default RecordScoreForm;
