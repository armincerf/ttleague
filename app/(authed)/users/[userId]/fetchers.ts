import { httpClient } from "@/lib/triplitServerClient";
import type { MatchScore } from "@/components/MatchScoreCard";
import { or } from "@triplit/client";
import type { User } from "@/triplit/schema";

export type Match = {
  id: string;
  date: Date;
  opponent: User;
  player: User;
  scores: MatchScore[];
  bestOf: number;
  result: "win" | "loss";
  ratingChange: number;
  tableNumber?: number;
  umpire?: User | null;
  isManuallyCreated?: boolean;
};

export async function fetchUser(userId: string) {
  const client = httpClient();
  const user = await client.fetchById("users", userId);
  if (!user) {
    console.error("User not found", userId);
  }
  return user;
}

type TriplitMatch = {
  player_1: string;
  player_2: string;
  games: {
    player_1_score: number;
    player_2_score: number;
  }[];
};

function getMatchWinner(match: TriplitMatch) {
  let player_1_score = 0;
  let player_2_score = 0;
  // biome-ignore lint/complexity/noForEach: <explanation>
  match.games.forEach((game) => {
    player_1_score += game.player_1_score > player_2_score ? 1 : 0;
    player_2_score += game.player_2_score > player_1_score ? 1 : 0;
  });
  return player_1_score > player_2_score ? match.player_1 : match.player_2;
}

export async function fetchUserMatches(userId: string): Promise<Match[]> {
  const client = httpClient();
  const matches = await client.fetch(
    client
      .query("matches")
      .where([
        or([
          ["player1.id", "=", userId],
          ["player2.id", "=", userId],
        ]),
      ])
      .include("player1")
      .include("player2")
      .include("umpireUser")
      .include("games")
      .order("created_at", "DESC")
      .build()
  );

  // Calculate actual stats from matches
  const stats = matches.reduce(
    (acc, match) => {
      const isWinner = getMatchWinner(match) === userId;
      return {
        matchesPlayed: acc.matchesPlayed + 1,
        wins: acc.wins + (isWinner ? 1 : 0),
        losses: acc.losses + (isWinner ? 0 : 1),
      };
    },
    {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    }
  );

  // Compare and update if different
  const user = await client.fetchById("users", userId);
  if (
    user &&
    (user.matches_played !== stats.matchesPlayed ||
      user.wins !== stats.wins ||
      user.losses !== stats.losses)
  ) {
    await client.update("users", userId, (user) => {
      user.matches_played = stats.matchesPlayed;
      user.wins = stats.wins;
      user.losses = stats.losses;
    });
    console.warn("Updated user stats due to mismatch:", {
      old: user,
      new: stats,
    });
  }

  return matches
    ?.map((match) => {
      const isPlayer1 = match.player_1 === userId;
      const opponent = isPlayer1 ? match.player2 : match.player1;
      const player = isPlayer1 ? match.player1 : match.player2;
      const matchScores = match.games.map((game) => ({
        player1Points: isPlayer1 ? game.player_1_score : game.player_2_score,
        player2Points: isPlayer1 ? game.player_2_score : game.player_1_score,
        isValid: true,
        startedAt: new Date(game.created_at),
        completedAt: game.completed_at
          ? new Date(game.completed_at)
          : undefined,
      })) satisfies MatchScore[];
      if (matchScores.length === 0 || !player || !opponent) return null;

      return {
        id: match.id,
        date: new Date(match.created_at),
        opponent,
        player,
        scores: matchScores,
        bestOf: match.best_of,
        result: match.winner === userId ? "win" : "loss",
        ratingChange: match.ranking_score_delta,
        tableNumber: match.table_number,
        umpire: match.umpireUser,
        isManuallyCreated: !!match.manually_created,
      } as const;
    })
    .filter(Boolean);
}
