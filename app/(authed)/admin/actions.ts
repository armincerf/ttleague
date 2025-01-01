"use server";

import OpenAI from "openai";
import { httpClient } from "@/lib/triplitServerClient";
import logger from "@/lib/logging";
import { z } from "zod";
import { format, addWeeks, addDays, isBefore } from "date-fns";
import type { Match } from "@/triplit/schema";

if (!process.env.OPENAI_API_KEY) {
	throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const eventSuggestionSchema = z.object({
	name: z.string(),
	description: z.string(),
	start_time: z.string(),
	end_time: z.string(),
	club_id: z.string(),
	league_id: z.string(),
	tables: z.coerce.number(),
	capacity: z.coerce.number(),
});

export type GenerateEventError = {
	code: "OPENAI_ERROR" | "VALIDATION_ERROR" | "UNKNOWN_ERROR";
	message: string;
	details?: unknown;
};

async function getPrevEventDetails() {
	try {
		const client = httpClient();
		const prevEvent = await client.fetch(
			client
				.query("events")
				.order("start_time", "DESC")
				.include("matches", (rel) =>
					rel("matches")
						.include("player1", (rel) => rel("player1").build())
						.include("player2", (rel) => rel("player2").build())
						.include("games", (rel) => rel("games").build())
						.build(),
				)
				.limit(1)
				.build(),
		);
		const topPlayers = await client.fetch(
			client
				.query("users")
				.where(["matches_played", ">", 0])
				.order("wins", "DESC")
				.limit(3)
				.build(),
		);

		return {
			prevEventMatches: prevEvent[0].matches.map((match) => {
				const player1 = `${match.player1?.first_name} ${match.player1?.last_name}`;
				const player2 = `${match.player2?.first_name} ${match.player2?.last_name}`;
				const winner = match.winner === match.player1?.id ? player1 : player2;
				return {
					player1,
					player2,
					winner,
					games: match.games.map((game) => ({
						game: game.game_number,
						p1_score: game.player_1_score,
						p2_score: game.player_2_score,
						winner: game.winner === match.player1?.id ? player1 : player2,
					})),
				};
			}),
			topPlayers,
		};
	} catch (error) {
		logger.error({ error }, "Failed to fetch previous event details");
		return null;
	}
}

export async function generateEventSuggestion(previousEvent: {
	name: string;
	description: string;
	start_time: Date;
	end_time: Date;
	club_id: string;
	league_id: string;
	tables: number[];
	capacity: number;
}): Promise<
	| { data: z.infer<typeof eventSuggestionSchema>; error: null }
	| { data: null; error: GenerateEventError }
> {
	try {
		const today = new Date();
		const oneWeekFromPrev = addWeeks(previousEvent.start_time, 1);
		const dayOfWeek = previousEvent.start_time.getDay();

		let nextDate = oneWeekFromPrev;
		if (isBefore(oneWeekFromPrev, today)) {
			nextDate = today;
			while (nextDate.getDay() !== dayOfWeek) {
				nextDate = addDays(nextDate, 1);
			}
		}

		nextDate.setHours(previousEvent.start_time.getHours());
		nextDate.setMinutes(previousEvent.start_time.getMinutes());

		const prevEventDetails = await getPrevEventDetails();
		const leaderboardInfo = prevEventDetails?.topPlayers
			? `Top players: ${prevEventDetails.topPlayers.map((player) => `${player.first_name} ${player.last_name}`).join(", ")} Previous event matches: ${JSON.stringify(prevEventDetails.prevEventMatches)}`
			: "";

		const prompt = `Given the following previous event details:
Name: ${previousEvent.name}
Description: ${previousEvent.description}
Time: ${format(previousEvent.start_time, "HH:mm")} - ${format(previousEvent.end_time, "HH:mm")}
${leaderboardInfo}

Please generate a new event description that:
1. If available, incorporates current leaderboard dynamics (e.g., rivalries, winning streaks, or milestone matches)
2. Maintains a fun and engaging tone while being relevant to table tennis
3. Is as short as possible and doesn't use flashy language. keep it understated and factual and simple. short mention to who is winning a lot and also who is losing a lot.

Remember that a previous event title like Singles League #5 means its the 5th event in the series.

The response must be a valid JSON object with the following fields:
- name: "${previousEvent.name}" (keep exactly the same format, just update the date)
- description (string, incorporating historical events and player dynamics)
- start_time (ISO string for ${format(nextDate, "EEEE do MMMM")} at ${format(previousEvent.start_time, "HH:mm")})
- end_time (ISO string for ${format(nextDate, "EEEE do MMMM")} at ${format(previousEvent.end_time, "HH:mm")})
- club_id: "${previousEvent.club_id}"
- league_id: "${previousEvent.league_id}"
- tables: ${Math.max(...previousEvent.tables)}
- capacity: ${previousEvent.capacity}

Make the description engaging and playful, weaving together the historical event and table tennis theme. If there are top players, try to create some friendly competitive narrative.`;

		try {
			const completion = await openai.chat.completions.create({
				messages: [{ role: "user", content: prompt }],
				model: "gpt-4o-mini",
				response_format: { type: "json_object" },
			});

			const suggestion = completion.choices[0].message.content;
			if (!suggestion) {
				logger.error("OpenAI returned empty content");
				return {
					data: null,
					error: {
						code: "OPENAI_ERROR",
						message: "No suggestion was generated",
					},
				};
			}

			logger.info({ rawSuggestion: suggestion }, "Raw OpenAI response");

			try {
				const parsed = JSON.parse(suggestion);
				logger.info({ parsed }, "Parsed JSON response");

				const validated = eventSuggestionSchema.parse(parsed);
				logger.info({ validated }, "Validated suggestion");

				return { data: validated, error: null };
			} catch (parseError) {
				logger.error(
					{
						parseError,
						suggestion,
						parseErrorMessage:
							parseError instanceof Error
								? parseError.message
								: "Unknown parse error",
					},
					"Failed to validate suggestion",
				);

				return {
					data: null,
					error: {
						code: "VALIDATION_ERROR",
						message: "Failed to validate the generated suggestion",
						details:
							parseError instanceof Error ? parseError.message : parseError,
					},
				};
			}
		} catch (openaiError) {
			logger.error(
				{
					openaiError,
					errorMessage:
						openaiError instanceof Error
							? openaiError.message
							: "Unknown OpenAI error",
					errorDetails: openaiError instanceof Error ? openaiError : undefined,
				},
				"OpenAI API error",
			);

			return {
				data: null,
				error: {
					code: "OPENAI_ERROR",
					message:
						openaiError instanceof Error
							? `OpenAI error: ${openaiError.message}`
							: "Failed to generate suggestion from OpenAI",
					details: openaiError,
				},
			};
		}
	} catch (error) {
		logger.error({ error }, "Error generating event suggestion");
		return {
			data: null,
			error: {
				code: "UNKNOWN_ERROR",
				message: "An unexpected error occurred",
				details: error,
			},
		};
	}
}
