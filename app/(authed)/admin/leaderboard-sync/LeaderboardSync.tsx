"use client";

import { useState } from "react";
import { useQuery } from "@triplit/react";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/ComboBox";
import type { Game, Match, User } from "@/triplit/schema";
import { client } from "../adminClient";
import {
	QueryClientProvider,
	QueryClient,
	useQuery as useTSQuery,
} from "@tanstack/react-query";

type UserStats = {
	userId: string;
	firstName: string;
	lastName: string;
	matchesPlayed: number;
	wins: number;
	losses: number;
	rating: number;
};

function calculateUserStats(
	matches: (Match & { games: Game[] })[],
	users: User[],
): UserStats[] {
	const statsMap = new Map<string, UserStats>();

	// Initialize stats for all users
	for (const user of users) {
		statsMap.set(user.id, {
			userId: user.id,
			firstName: user.first_name,
			lastName: user.last_name,
			matchesPlayed: 0,
			wins: 0,
			losses: 0,
			rating: 0,
		});
	}

	// Calculate stats from matches
	for (const match of matches) {
		const player1Stats = statsMap.get(match.player_1);
		const player2Stats = statsMap.get(match.player_2);

		if (!player1Stats || !player2Stats) continue;

		// Count games won by each player
		const player1Wins = match.games.filter(
			(g) => g.winner === match.player_1,
		).length;
		const player2Wins = match.games.filter(
			(g) => g.winner === match.player_2,
		).length;

		// Determine match winner (best of 3 = first to 2 wins)
		const matchWinner =
			player1Wins >= 2
				? match.player_1
				: player2Wins >= 2
					? match.player_2
					: null;

		if (matchWinner) {
			player1Stats.matchesPlayed++;
			player2Stats.matchesPlayed++;

			if (matchWinner === match.player_1) {
				player1Stats.wins++;
				player2Stats.losses++;
			} else {
				player1Stats.losses++;
				player2Stats.wins++;
			}
		}
	}

	return Array.from(statsMap.values());
}

function LeaderboardSyncInner() {
	const [selectedEventId, setSelectedEventId] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	const { results: events } = useQuery(
		client,
		client
			.query("events")
			.include("matches", (rel) => rel("matches").include("games").build()),
	);
	const { results: games } = useQuery(
		client,
		client.query("games").where([["match.event_id", "=", selectedEventId]]),
	);
	const { data: users } = useTSQuery({
		queryKey: ["users"],
		queryFn: () =>
			client.fetch(client.query("users").build(), { policy: "remote-only" }),
	});

	const eventOptions =
		events?.map((event) => ({
			value: event.id,
			label: event.name,
		})) ?? [];

	const event = events?.find((event) => event.id === selectedEventId);

	const userStats =
		event && users ? calculateUserStats(event.matches, users) : [];

	async function handleSync() {
		if (!userStats.length || !event) return;

		setIsUpdating(true);
		try {
			for (const stats of userStats) {
				try {
					await client.http.update("users", stats.userId, (user) => {
						user.matches_played = stats.matchesPlayed;
						user.wins = stats.wins;
						user.losses = stats.losses;
					});
				} catch (error) {
					console.error(`Failed to update user ${stats.userId}:`, error);
				}
			}

			// Update match winners
			for (const match of event.matches) {
				const player1Wins = match.games.filter(
					(g) => g.winner === match.player_1,
				).length;
				const player2Wins = match.games.filter(
					(g) => g.winner === match.player_2,
				).length;

				const matchWinner =
					player1Wins >= 2
						? match.player_1
						: player2Wins >= 2
							? match.player_2
							: null;

				if (matchWinner) {
					await client.http.update("matches", match.id, (m) => {
						m.winner = matchWinner;
					});
				}
			}
		} catch (error) {
			console.error("Failed to sync leaderboard:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	return (
		<div className="space-y-6">
			<ComboBox
				options={eventOptions}
				value={selectedEventId}
				onChange={setSelectedEventId}
				placeholder="Select event..."
				searchPlaceholder="Search events..."
				emptyText="No events found"
			/>

			{userStats.length > 0 && (
				<>
					<div className="rounded-md border">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="p-2 text-left">Player</th>
									<th className="p-2 text-left">Matches</th>
									<th className="p-2 text-left">Wins</th>
									<th className="p-2 text-left">Losses</th>
								</tr>
							</thead>
							<tbody>
								{userStats.map((stats) => (
									<tr key={stats.userId} className="border-b">
										<td className="p-2">{`${stats.firstName} ${stats.lastName}`}</td>
										<td className="p-2">{stats.matchesPlayed}</td>
										<td className="p-2">{stats.wins}</td>
										<td className="p-2">{stats.losses}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<Button onClick={handleSync} disabled={isUpdating}>
						{isUpdating ? "Updating..." : "Save Changes"}
					</Button>
				</>
			)}
		</div>
	);
}

const queryClient = new QueryClient();
export function LeaderboardSync() {
	if (typeof window === "undefined") return null;
	return (
		<QueryClientProvider client={queryClient}>
			<LeaderboardSyncInner />
		</QueryClientProvider>
	);
}
