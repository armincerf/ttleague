"use client";

import { useState } from "react";
import { useQuery } from "@triplit/react";
import { Button } from "@/components/ui/button";
import type { Game, Match, User } from "@/triplit/schema";
import { client } from "../adminClient";
import {
  QueryClientProvider,
  QueryClient,
  useQuery as useTSQuery,
} from "@tanstack/react-query";
import { getMatchWinner } from "@/lib/scoreboard/utils"; // Uses the updated logic

type UserStats = {
  userId: string;
  firstName: string;
  lastName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  rating: number;
};

// Calculate overall stats for each user
function calculateUserStats(
  matches: (Match & { games: Game[] })[],
  users: User[]
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

    const matchWinner = getMatchWinner(match);

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all events (with matches + games) and all users
  const { results: events } = useQuery(
    client,
    client
      .query("events")
      .include("matches", (rel) => rel("matches").include("games").build())
  );
  const { data: users } = useTSQuery({
    queryKey: ["users"],
    queryFn: () =>
      client.fetch(client.query("users").build(), { policy: "remote-only" }),
  });

  // Flatten all matches across all events
  const allMatches = events?.flatMap((event) => event.matches || []) ?? [];
  const userStats = users ? calculateUserStats(allMatches, users) : [];

  async function handleSync() {
    // Reset state each time
    setErrorMessages([]);
    setSuccessMessage(null);

    // Basic validation checks
    if (!userStats.length || !events?.length) {
      setErrorMessages((prev) => [
        ...prev,
        "No user stats or events available for syncing.",
      ]);
      return;
    }

    setIsUpdating(true);
    setProgressMessage("Starting the update process...");

    try {
      //
      // 1. Update each user's basic stats
      //
      setProgressMessage("Updating user stats...");
      for (const stats of userStats) {
        try {
          await client.http.update("users", stats.userId, (user) => {
            user.matches_played = stats.matchesPlayed;
            user.wins = stats.wins;
            user.losses = stats.losses;
          });
        } catch (error) {
          setErrorMessages((prev) => [
            ...prev,
            `Failed to update user ${stats.userId}: ${String(error)}`,
          ]);
        }
      }

      //
      // 2. Update game winners and match winners
      //
      // First, compute the total number of matches so we can show progress
      const totalMatches = events.reduce(
        (count, event) => count + (event.matches?.length || 0),
        0
      );
      let matchCounter = 0;

      setProgressMessage("Updating matches and their games...");

      for (const event of events) {
        for (const match of event.matches) {
          matchCounter++;
          const matchWinner = getMatchWinner(match);

          // Show the match-level progress
          setProgressMessage(
            `Updating match ${matchCounter}/${totalMatches}...`
          );

          // Update each game if winner not set
          const totalGames = match.games.length;

          for (let i = 0; i < match.games.length; i++) {
            const game = match.games[i];

            // Show the game-level progress
            setProgressMessage(
              `Updating match ${matchCounter}/${totalMatches} — game ${
                i + 1
              }/${totalGames}...`
            );

            if (!game.winner) {
              try {
                await client.http.update("games", game.id, (g) => {
                  g.winner =
                    game.player_1_score > game.player_2_score
                      ? match.player_1
                      : match.player_2;
                });
              } catch (error) {
                setErrorMessages((prev) => [
                  ...prev,
                  `Failed to update game ${game.id}: ${String(error)}`,
                ]);
              }
            }
          }

          // Finally, update the match if there is a winner
          if (matchWinner) {
            try {
              await client.http.update("matches", match.id, (m) => {
                m.winner = matchWinner;
              });
            } catch (error) {
              setErrorMessages((prev) => [
                ...prev,
                `Failed to update match ${match.id}: ${String(error)}`,
              ]);
            }
          }
        }
      }

      // 3. If we got this far, we consider it a success (even if some updates had errors)
      setProgressMessage(null);
      setSuccessMessage("All requested updates completed (see errors if any).");
    } catch (error) {
      // Catch unexpected errors from the entire sync process
      setErrorMessages((prev) => [
        ...prev,
        `Unexpected error during sync: ${String(error)}`,
      ]);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {userStats.length > 0 && (
        <>
          {/* Display the calculated stats */}
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

          {/* Sync button and progress message */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleSync} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
            {progressMessage && (
              <p className="text-sm text-gray-500">{progressMessage}</p>
            )}

            {/* Show any errors */}
            {errorMessages.length > 0 && (
              <div className="mt-2 text-sm text-red-600 space-y-1">
                {errorMessages.map((error, idx) => (
                  <p key={error}>• {error}</p>
                ))}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <p className="mt-2 text-sm text-green-600">{successMessage}</p>
            )}
          </div>
        </>
      )}

      {/* If there are no userStats at all */}
      {userStats.length === 0 && (
        <p className="text-sm text-red-600">
          No users or matches found. Nothing to show.
        </p>
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
