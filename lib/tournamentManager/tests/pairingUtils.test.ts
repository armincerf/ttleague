import {
	getAllPossiblePairings,
	hasPlayedMatch,
	findValidPlayerPair,
} from "../utils/pairingUtils";
import type { Match } from "@/triplit/schema";
import { describe, it, expect } from "vitest";

describe("pairingUtils", () => {
	describe("getAllPossiblePairings", () => {
		it("should return all possible pairs", () => {
			const players = [{ id: "1" }, { id: "2" }, { id: "3" }];

			const pairs = getAllPossiblePairings(players);

			expect(pairs).toHaveLength(3);
			expect(pairs).toContainEqual([{ id: "1" }, { id: "2" }]);
			expect(pairs).toContainEqual([{ id: "1" }, { id: "3" }]);
			expect(pairs).toContainEqual([{ id: "2" }, { id: "3" }]);
		});
	});

	describe("hasPlayedMatch", () => {
		const matches: Match[] = [
			{ id: "1", player_1: "1", player_2: "2", status: "ended" } as Match,
		];

		it("should return true if players have played", () => {
			expect(hasPlayedMatch("1", "2", matches)).toBe(true);
			expect(hasPlayedMatch("2", "1", matches)).toBe(true);
		});

		it("should return false if players haven't played", () => {
			expect(hasPlayedMatch("1", "3", matches)).toBe(false);
		});
	});
});
