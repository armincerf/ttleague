"use client";

import { useForm } from "@tanstack/react-form";
import { nanoid } from "nanoid";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useQuery } from "@triplit/react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { ComboBox } from "./components/ComboBox";
import { MatchScoreInput, type MatchScore } from "@/components/MatchScoreInput";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useCallback, useEffect } from "react";
import { client } from "../adminClient";

const savedValuesSchema = z.object({
	eventId: z.string(),
	player1Id: z.string(),
	player2Id: z.string(),
	umpireId: z.string(),
	bestOf: z.number().min(3).max(7),
	rankingScoreDelta: z.number().min(0),
});

type SavedValues = z.infer<typeof savedValuesSchema>;

const matchEntrySchema = z.object({
	eventId: z.string(),
	player1Id: z.string(),
	player2Id: z.string(),
	umpireId: z.string(),
	bestOf: z.number().min(3).max(7),
	scores: z.array(
		z.object({
			player1Points: z.number().min(0),
			player2Points: z.number().min(0),
			isValid: z.boolean(),
		}),
	),
	rankingScoreDelta: z.number().min(0),
});

type MatchEntryFormValues = z.infer<typeof matchEntrySchema>;

const STORAGE_KEY = "manual-match-entry-form";

const createInitialScores = (bestOf: number): MatchScore[] => {
	return Array.from({ length: bestOf }, () => ({
		player1Points: 0,
		player2Points: 0,
		isValid: false,
	}));
};

export function ManualMatchEntryForm() {
	const { toast } = useToast();

	// Query our data
	const { results: events, fetching: eventsLoading } = useQuery(
		client,
		client.query("events"),
	);

	const { results: users, fetching: usersLoading } = useQuery(
		client,
		client.query("users").select(["id", "first_name", "last_name"]),
	);

	// Get saved values from localStorage
	const savedValues = useMemo(() => {
		if (typeof window === "undefined") return null;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return null;

		try {
			const parsed = JSON.parse(saved);
			return savedValuesSchema.parse(parsed);
		} catch (error) {
			console.error("Invalid saved values:", error);
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
	}, []);

	const form = useForm({
		defaultValues: {
			eventId: savedValues?.eventId ?? "",
			player1Id: savedValues?.player1Id ?? "",
			player2Id: savedValues?.player2Id ?? "",
			umpireId: savedValues?.umpireId ?? "",
			bestOf: savedValues?.bestOf ?? 3,
			rankingScoreDelta: savedValues?.rankingScoreDelta ?? 0,
			scores: createInitialScores(savedValues?.bestOf ?? 3),
		} satisfies MatchEntryFormValues,
		onSubmit: async ({ value }) => {
			try {
				const event = await client.fetchById("events", value.eventId);
				if (!event) {
					throw new Error("Event not found");
				}

				await client.transact(async (tx) => {
					const eventStartTime = new Date(event.start_time);
					// assume 1 hour after event + 10 mins for each game
					const matchStartTime = new Date(
						eventStartTime.getTime() + value.bestOf * 60 * 1000,
					);
					const numberOfGames = value.scores.length;
					const matchEndTime = new Date(
						matchStartTime.getTime() + numberOfGames * 60 * 1000,
					);

					// Calculate who won the most games
					let player1Wins = 0;
					let player2Wins = 0;
					for (const score of value.scores) {
						if (score.player1Points > score.player2Points) player1Wins++;
						else if (score.player2Points > score.player1Points) player2Wins++;
					}
					const winnerId =
						player1Wins > player2Wins ? value.player1Id : value.player2Id;

					const matchId = nanoid();
					await tx.insert("matches", {
						id: matchId,
						event_id: value.eventId,
						player_1: value.player1Id,
						player_2: value.player2Id,
						umpire: value.umpireId,
						best_of: value.bestOf,
						ranking_score_delta: value.rankingScoreDelta,
						manually_created: true,
						created_at: matchStartTime,
						startTime: matchStartTime,
						endTime: matchEndTime,
						table_number: 1,
						status: "ended",
						winner: winnerId,
					});
					for (let i = 0; i < numberOfGames; i++) {
						const p1Score = value.scores[i].player1Points;
						const p2Score = value.scores[i].player2Points;
						if (p1Score === 0 && p2Score === 0) {
							continue;
						}
						const gameStartTime = new Date(
							matchStartTime.getTime() + i * 60 * 1000 * 5,
						);
						const gameEndTime = new Date(
							gameStartTime.getTime() + 60 * 1000 * 5,
						);
						await tx.insert("games", {
							id: nanoid(),
							match_id: matchId,
							game_number: i + 1,
							player_1_score: value.scores[i].player1Points,
							player_2_score: value.scores[i].player2Points,
							completed_at: gameEndTime,
							winner:
								value.scores[i].player1Points > value.scores[i].player2Points
									? value.player1Id
									: value.player2Id,
							started_at: gameStartTime,
						});
					}
				});

				toast({
					title: "Success",
					description: "Match has been successfully recorded",
				});

				// Save form values before resetting
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({
						eventId: value.eventId,
						player1Id: value.player1Id,
						player2Id: value.player2Id,
						umpireId: value.umpireId,
						bestOf: value.bestOf,
						rankingScoreDelta: value.rankingScoreDelta,
					}),
				);

				// Only reset scores
				form.setFieldValue("scores", []);
			} catch (error) {
				toast({
					title: "Error",
					description:
						error instanceof Error ? error.message : "Failed to submit match",
					variant: "destructive",
				});
			}
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: matchEntrySchema,
		},
	});

	// Show loading state while data is being fetched
	if (eventsLoading || usersLoading) {
		return <div>Loading...</div>;
	}

	const eventOptions =
		events?.map((event) => ({
			value: event.id,
			label: event.name,
		})) ?? [];

	const userOptions =
		users?.map((user) => ({
			value: user.id,
			label: `${user.first_name} ${user.last_name}`,
		})) ?? [];

	const getPlayerName = (playerId: string) => {
		return users?.find((u) => u.id === playerId)?.first_name ?? "Player";
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
			className="space-y-6"
		>
			<form.Field name="eventId">
				{(field) => (
					<ComboBox
						options={eventOptions}
						value={field.state.value}
						onChange={field.handleChange}
						placeholder="Select event..."
						searchPlaceholder="Search events..."
						emptyText="No events found"
					/>
				)}
			</form.Field>

			<form.Field name="bestOf">
				{(field) => (
					<select
						value={field.state.value}
						onChange={(e) => field.handleChange(Number(e.target.value))}
						className="w-full p-2 border rounded"
					>
						<option value={3}>Best of 3</option>
						<option value={5}>Best of 5</option>
						<option value={7}>Best of 7</option>
					</select>
				)}
			</form.Field>

			<form.Field name="player1Id">
				{(field) => (
					<ComboBox
						options={userOptions}
						value={field.state.value}
						onChange={field.handleChange}
						placeholder="Select player 1..."
						searchPlaceholder="Search players..."
						emptyText="No players found"
					/>
				)}
			</form.Field>

			<form.Field name="player2Id">
				{(field) => (
					<ComboBox
						options={userOptions}
						value={field.state.value}
						onChange={field.handleChange}
						placeholder="Select player 2..."
						searchPlaceholder="Search players..."
						emptyText="No players found"
					/>
				)}
			</form.Field>

			<form.Field name="umpireId">
				{(field) => (
					<ComboBox
						options={userOptions}
						value={field.state.value}
						onChange={field.handleChange}
						placeholder="Select umpire..."
						searchPlaceholder="Search umpires..."
						emptyText="No umpires found"
					/>
				)}
			</form.Field>

			<form.Field name="rankingScoreDelta">
				{(field) => (
					<Input
						value={field.state.value}
						onChange={(e) => field.handleChange(Number(e.target.value))}
						placeholder="Ranking score delta..."
						type="number"
					/>
				)}
			</form.Field>

			<form.Field name="scores">
				{(field) => (
					<MatchScoreInput
						scores={field.state.value}
						onChange={field.handleChange}
						bestOf={form.getFieldValue("bestOf")}
						player1Name={getPlayerName(form.getFieldValue("player1Id"))}
						player2Name={getPlayerName(form.getFieldValue("player2Id"))}
					/>
				)}
			</form.Field>

			<Button type="submit" disabled={form.state.isSubmitting}>
				{form.state.isSubmitting ? "Submitting..." : "Submit Match"}
			</Button>
		</form>
	);
}
