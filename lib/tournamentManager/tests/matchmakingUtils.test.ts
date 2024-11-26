import { performMatchmaking } from "../utils/matchmakingUtils";
import { describe, it, expect } from "vitest";

type PlayerInfo = {
  userId: string;
  lastPlayedAt?: Date;
  lastUmpiredAt?: Date;
  usersPlayedToday?: string[];
  timesUmpiredToday?: number;
};

// Utility function to create a player
function createPlayer(
  userId: string,
  lastPlayedHoursAgo?: number,
  lastUmpiredHoursAgo?: number,
  usersPlayedToday: string[] = [],
  timesUmpiredToday = 0
): PlayerInfo {
  return {
    userId,
    lastPlayedAt: lastPlayedHoursAgo
      ? new Date(Date.now() - 1000 * 60 * 60 * lastPlayedHoursAgo)
      : undefined,
    lastUmpiredAt: lastUmpiredHoursAgo
      ? new Date(Date.now() - 1000 * 60 * 60 * lastUmpiredHoursAgo)
      : undefined,
    usersPlayedToday,
    timesUmpiredToday,
  };
}

describe("matchmakingUtils", () => {
  describe("performMatchmaking", () => {
    it("should create matches with players who haven't played against each other today", () => {
      const players = [
        createPlayer("1", 24, 48, ["2"]),
        createPlayer("2", 24, 48, ["1"]),
        createPlayer("3", 24, 48),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        playerOneId: "1",
        playerTwoId: "3",
        umpireId: "2",
      });
    });

    it("should not create matches if no valid pair is found", () => {
      const players = [
        createPlayer("1", 24, 48, ["2", "3"]),
        createPlayer("2", 24, 48, ["1", "3"]),
        createPlayer("3", 24, 48, ["1", "2"]),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(0);
    });

    it("should handle a large number of players and create multiple matches", () => {
      const players = Array.from({ length: 100 }, (_, i) =>
        createPlayer(`${i + 1}`, 24 + i, 48 + i, [], i % 3)
      );

      const matches = performMatchmaking(players);

      // Since we have 100 players and need 3 users per match, we can have a maximum of 33 matches
      expect(matches.length).toBeGreaterThanOrEqual(33);
      expect(matches.length).toBeLessThanOrEqual(34);

      // Track all used IDs to ensure no duplicates
      const usedIds = new Set<string>();

      for (const match of matches) {
        // Check that player IDs are different
        expect(match.playerOneId).not.toEqual(match.playerTwoId);

        // Check that umpire is not one of the players
        expect([match.playerOneId, match.playerTwoId]).not.toContain(
          match.umpireId
        );

        // Check that each ID only appears once across all matches
        expect(usedIds.has(match.playerOneId)).toBe(false);
        expect(usedIds.has(match.playerTwoId)).toBe(false);
        expect(usedIds.has(match.umpireId)).toBe(false);

        usedIds.add(match.playerOneId);
        usedIds.add(match.playerTwoId);
        usedIds.add(match.umpireId);
      }

      // Check that the number of unique users used matches the expected number
      expect(usedIds.size).toEqual(matches.length * 3);

      // Leftover players are those who couldn't be matched
      const leftoverPlayers = players.filter(
        (player) => !usedIds.has(player.userId)
      );
      console.log("Leftover players:", leftoverPlayers.map((p) => p.userId));

      // No assertion on the specific leftover player, as it may vary
    });

    it("should prioritize players who haven't played yet", () => {
      const players = [
        createPlayer("1", undefined, 24),
        createPlayer("2", 24, 24),
        createPlayer("3", undefined, 48),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(1);
      // Players with undefined lastPlayedAt should be prioritized
      expect([matches[0].playerOneId, matches[0].playerTwoId]).toContain("1");
      expect([matches[0].playerOneId, matches[0].playerTwoId]).toContain("3");
    });

    it("should prioritize umpires who have never umpired", () => {
      const players = [
        createPlayer("1", 1, undefined), // Adjusted to have recently played
        createPlayer("2", 24, 24),
        createPlayer("3", 48, 48),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(1);
      expect(matches[0].umpireId).toEqual("1"); // Player who has never umpired
    });

    it("should handle cases where all players have played against each other today", () => {
      const players = [
        createPlayer("1", 24, 48, ["2", "3"]),
        createPlayer("2", 24, 48, ["1", "3"]),
        createPlayer("3", 24, 48, ["1", "2"]),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(0);
    });

    it("should handle an odd number of players and leave unmatched players", () => {
      const players = [
        createPlayer("1", 10, 20),
        createPlayer("2", 15, 25),
        createPlayer("3", 12, 22),
        createPlayer("4", 18, 28),
        createPlayer("5", 14, 24), // Odd number of players
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(1); // Only one match can be formed
      const usedIds = new Set(
        matches.flatMap((match) => [
          match.playerOneId,
          match.playerTwoId,
          match.umpireId,
        ])
      );

      // Two players should be left unmatched
      const leftoverPlayers = players.filter(
        (player) => !usedIds.has(player.userId)
      );
      expect(leftoverPlayers).toHaveLength(2);
    });

    it("should not pair players who have already played against each other today", () => {
      const players = [
        createPlayer("1", 10, 20, ["2"]),
        createPlayer("2", 12, 22, ["1"]),
        createPlayer("3", 14, 24),
        createPlayer("4", 16, 26),
        createPlayer("5", 18, 28),
        createPlayer("6", 20, 30),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(2);
      // Ensure that players 1 and 2 are not paired together
      for (const match of matches) {
        const pair = [match.playerOneId, match.playerTwoId];
        const hasBothPlayers = pair.includes("1") && pair.includes("2");
        expect(hasBothPlayers).toBe(false);
      }
    });

    it("should handle the case when there are no available umpires", () => {
      const players = [
        createPlayer("1", 10, 1),
        createPlayer("2", 12, 1),
        createPlayer("3", 14, 1),
        createPlayer("4", 16, 1),
      ];

      // All players have umpired recently
      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(1); // Only one match can be formed
      const usedIds = new Set(
        matches.flatMap((match) => [
          match.playerOneId,
          match.playerTwoId,
          match.umpireId,
        ])
      );

      // One player should be left unmatched due to no available umpire
      const leftoverPlayers = players.filter(
        (player) => !usedIds.has(player.userId)
      );
      expect(leftoverPlayers).toHaveLength(1);
    });

    it("should not assign the same user as both player and umpire", () => {
      const players = [
        createPlayer("1", 24, 48),
        createPlayer("2", 24, 48),
        createPlayer("3", 24, 48),
        createPlayer("4", 24, 48),
        createPlayer("5", 24, 48),
        createPlayer("6", 24, 48),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(2);

      const usedIds = new Set<string>();
      for (const match of matches) {
        // Ensure umpire is not one of the players
        expect([match.playerOneId, match.playerTwoId]).not.toContain(
          match.umpireId
        );

        // Ensure no user is assigned more than once
        expect(usedIds.has(match.playerOneId)).toBe(false);
        expect(usedIds.has(match.playerTwoId)).toBe(false);
        expect(usedIds.has(match.umpireId)).toBe(false);

        usedIds.add(match.playerOneId);
        usedIds.add(match.playerTwoId);
        usedIds.add(match.umpireId);
      }
    });

    it("should prioritize players who haven't played over those who have", () => {
      const players = [
        createPlayer("1", undefined, 48),
        createPlayer("2", undefined, 48),
        createPlayer("3", 24, 48),
        createPlayer("4", 24, 48),
        createPlayer("5", 24, 48),
        createPlayer("6", 24, 48),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(2);

      // Players "1" and "2" should be prioritized
      const firstMatchPlayers = [
        matches[0].playerOneId,
        matches[0].playerTwoId,
      ];
      expect(firstMatchPlayers).toContain("1");
      expect(firstMatchPlayers).toContain("2");
    });

    it("should handle players with no lastPlayedAt or lastUmpiredAt", () => {
      const players = [
        createPlayer("1", undefined, undefined),
        createPlayer("2", undefined, undefined),
        createPlayer("3", undefined, undefined),
        createPlayer("4", undefined, undefined),
        createPlayer("5", undefined, undefined),
        createPlayer("6", undefined, undefined),
      ];

      const matches = performMatchmaking(players);

      expect(matches).toHaveLength(2);

      const usedIds = new Set<string>();
      for (const match of matches) {
        // Ensure no user is assigned more than once
        expect(usedIds.has(match.playerOneId)).toBe(false);
        expect(usedIds.has(match.playerTwoId)).toBe(false);
        expect(usedIds.has(match.umpireId)).toBe(false);

        usedIds.add(match.playerOneId);
        usedIds.add(match.playerTwoId);
        usedIds.add(match.umpireId);
      }
    });
  });
});
