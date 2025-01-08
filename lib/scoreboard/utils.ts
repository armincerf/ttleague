import type { ScoreboardContext } from "./machine";
import type { Player } from "./machine";

type PlayerScore = { currentScore: number };
type PlayerName = { firstName?: string; lastName?: string };
type PlayerWithScore = PlayerName & PlayerScore;
type PlayerWithGames = PlayerWithScore & { gamesWon: number };

type TriplitMatch = {
  player_1: string;
  player_2: string;
  games: {
    player_1_score: number;
    player_2_score: number;
  }[];
};

export function getMatchWinner(match: TriplitMatch) {
  let player_1_wins = 0;
  let player_2_wins = 0;

  // biome-ignore lint/complexity/noForEach: <explanation>
  match.games.forEach((game) => {
    if (game.player_1_score > game.player_2_score) {
      player_1_wins++;
    } else if (game.player_2_score > game.player_1_score) {
      player_2_wins++;
    }
  });

  if (player_1_wins > player_2_wins) {
    return match.player_1;
  }
  if (player_2_wins > player_1_wins) {
    return match.player_2;
  }
  return null;
}

export function getWinner({
  playerOne,
  playerTwo,
  pointsToWin,
}: {
  playerOne: PlayerScore;
  playerTwo: PlayerScore;
  pointsToWin: number;
}): boolean | null {
  const twoPointLead =
    Math.abs(playerOne.currentScore - playerTwo.currentScore) >= 2;
  const reachedMinPoints =
    Math.max(playerOne.currentScore, playerTwo.currentScore) >= pointsToWin;

  if (reachedMinPoints && twoPointLead) {
    return playerOne.currentScore > playerTwo.currentScore;
  }
  return null;
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
    return { firstName: "", lastName: "" };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName: lastName || "" };
}

export function formatPlayerName(player: {
  firstName?: string;
  lastName?: string;
  name?: string;
}) {
  if (!player?.firstName) {
    if (player?.name) {
      return player.name;
    }
    return "-";
  }
  if (!player.lastName) {
    return player.firstName;
  }
  return `${player.firstName} ${player.lastName?.slice(0, 1)}`.trim();
}

export function shouldAlternateEveryPoint({
  playerOne,
  playerTwo,
  pointsToWin,
}: {
  playerOne: PlayerScore;
  playerTwo: PlayerScore;
  pointsToWin: number;
}): boolean {
  return (
    playerOne.currentScore >= pointsToWin - 1 &&
    playerTwo.currentScore >= pointsToWin - 1
  );
}

export function calculateCurrentServer({
  playerOne,
  playerTwo,
  pointsToWin,
  playerOneStarts,
}: {
  playerOne?: PlayerWithGames;
  playerTwo?: PlayerWithGames;
  pointsToWin: number;
  playerOneStarts: boolean;
}): string {
  if (!playerOne || !playerTwo) {
    return "";
  }
  const totalScore = playerOne.currentScore + playerTwo.currentScore;
  const totalGames = playerOne.gamesWon + playerTwo.gamesWon;
  const isOddGame = totalGames % 2 === 1;
  const effectivePlayerOneStarts = isOddGame
    ? !playerOneStarts
    : playerOneStarts;

  // Handle deuce scenario
  if (shouldAlternateEveryPoint({ playerOne, playerTwo, pointsToWin })) {
    return (totalScore % 2 === 0) === effectivePlayerOneStarts
      ? formatPlayerName(playerOne) || "Player 1"
      : formatPlayerName(playerTwo) || "Player 2";
  }

  // Determine points per serve based on pointsToWin
  const pointsPerServe = pointsToWin <= 11 ? 2 : 5;
  const serviceBlock = Math.floor(totalScore / pointsPerServe);

  return (serviceBlock % 2 === 0) === effectivePlayerOneStarts
    ? formatPlayerName(playerOne) || "Player 1"
    : formatPlayerName(playerTwo) || "Player 2";
}
