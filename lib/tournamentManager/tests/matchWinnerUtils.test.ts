import { createMatchWinner } from "../utils/matchWinnerUtils";
import {
	createTestClient,
	setupTournamentTest,
	createMockMatch,
} from "./triplitTestUtils";
import { describe, it, expect } from "vitest";

describe("matchWinnerUtils", () => {
	const testClient = createTestClient();
	const matchWinner = createMatchWinner(testClient);

	describe("confirmWinner", () => {
		it("should set winner and update match status", async () => {
			const { player1 } = await setupTournamentTest(testClient);
			const match = await createMockMatch(testClient, {
				status: "ongoing",
			});

			await matchWinner.confirmWinner(match.id, player1.id);

			const updatedMatch = await testClient.fetchById("matches", match.id);
			expect(updatedMatch?.winner).toBe(player1.id);
			expect(updatedMatch?.status).toBe("ongoing");
			expect(updatedMatch?.endTime).toBeDefined();
		});
	});

	describe("confirmMatch", () => {
		it("should add player to confirmed list", async () => {
			const { player1 } = await setupTournamentTest(testClient);
			const match = await createMockMatch(testClient, {
				status: "ongoing",
				umpireConfirmed: true,
			});

			await matchWinner.confirmMatch(match.id, player1.id);

			const updatedMatch = await testClient.fetchById("matches", match.id);
			expect(updatedMatch?.playersConfirmed.has(player1.id)).toBe(true);
		});
	});
});
